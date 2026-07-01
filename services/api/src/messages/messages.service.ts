import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionStatus, NotificationType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { publicDisplayName, ProfileWithUser } from '../network/network.utils';

const MESSAGE_ATTACHMENT_DIR = join(process.cwd(), 'uploads', 'message-attachments');
const MAX_MESSAGE_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MESSAGE_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]);

type MessageFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

type MessageRecord = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
  readAt: Date | null;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
};

function orderedParticipants(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private sanitizeFileName(name: string) {
    const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    return base || 'attachment';
  }

  private saveAttachment(file: MessageFile) {
    if (!ALLOWED_MESSAGE_ATTACHMENT_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Attachment must be PDF, Word, plain text, or an image (JPG, PNG, GIF, WEBP)',
      );
    }
    if (file.size > MAX_MESSAGE_ATTACHMENT_BYTES) {
      throw new BadRequestException('Attachment must be 10 MB or smaller');
    }

    if (!existsSync(MESSAGE_ATTACHMENT_DIR)) {
      mkdirSync(MESSAGE_ATTACHMENT_DIR, { recursive: true });
    }

    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(MESSAGE_ATTACHMENT_DIR, filename), file.buffer);

    return {
      attachmentUrl: `/uploads/message-attachments/${filename}`,
      attachmentFileName: this.sanitizeFileName(file.originalname),
      attachmentMimeType: file.mimetype,
    };
  }

  private mapMessageItem(message: MessageRecord, viewerId: string) {
    return {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      createdAt: message.createdAt,
      readAt: message.readAt,
      isMine: message.senderId === viewerId,
      attachmentUrl: message.attachmentUrl,
      attachmentFileName: message.attachmentFileName,
      attachmentMimeType: message.attachmentMimeType,
    };
  }

  private mapParticipant(profile: ProfileWithUser | null, userId: string) {
    if (!profile) {
      return { userId, fullName: null, headline: null, avatarUrl: null };
    }
    return {
      userId: profile.userId,
      fullName: publicDisplayName(profile),
      headline: profile.headline,
      avatarUrl: profile.avatarUrl,
    };
  }

  private async findConnection(userId: string, otherUserId: string) {
    return this.prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private mapConnectionContext(
    userId: string,
    connection: { id: string; status: ConnectionStatus; fromUserId: string; toUserId: string } | null,
  ) {
    if (!connection) {
      return {
        connectionId: null as string | null,
        connectionStatus: 'NONE' as string,
        connectionDirection: null as 'sent' | 'received' | null,
        canReply: false,
      };
    }
    const isReceived = connection.toUserId === userId;
    const canReply = connection.status === ConnectionStatus.ACCEPTED;
    return {
      connectionId: connection.id,
      connectionStatus: connection.status,
      connectionDirection: isReceived ? ('received' as const) : ('sent' as const),
      canReply,
    };
  }

  private async findConversationBetween(userId: string, otherUserId: string) {
    const [participantAId, participantBId] = orderedParticipants(userId, otherUserId);
    return this.prisma.conversation.findUnique({
      where: {
        participantAId_participantBId: { participantAId, participantBId },
      },
    });
  }

  private async assertCanViewThread(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Invalid conversation');
    }

    const conversation = await this.findConversationBetween(userId, otherUserId);
    if (conversation) {
      return;
    }

    const connection = await this.findConnection(userId, otherUserId);
    if (!connection) {
      throw new ForbiddenException('You cannot view this conversation');
    }
    if (connection.status === ConnectionStatus.ACCEPTED) {
      return;
    }
    if (connection.status === ConnectionStatus.PENDING) {
      return;
    }
    throw new ForbiddenException('You cannot view this conversation yet');
  }

  private async assertCanAccessThread(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Invalid conversation');
    }
    const connection = await this.findConnection(userId, otherUserId);
    if (!connection) {
      throw new ForbiddenException('You cannot view this conversation');
    }
    if (connection.status === ConnectionStatus.ACCEPTED) {
      return connection;
    }
    if (connection.status === ConnectionStatus.PENDING) {
      return connection;
    }
    throw new ForbiddenException('You cannot view this conversation yet');
  }

  private async assertConnected(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('You cannot message yourself');
    }

    const connection = await this.prisma.connection.findFirst({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId },
        ],
      },
    });

    if (!connection) {
      throw new ForbiddenException('You can only message your connections');
    }
  }

  private async getConversationForUser(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.participantAId !== userId && conversation.participantBId !== userId) {
      throw new ForbiddenException('Conversation not found');
    }
    return conversation;
  }

  async getOrCreateConversation(userId: string, otherUserId: string) {
    const [participantAId, participantBId] = orderedParticipants(userId, otherUserId);

    const existing = await this.prisma.conversation.findUnique({
      where: {
        participantAId_participantBId: { participantAId, participantBId },
      },
    });
    if (existing) {
      return this.getConversationDetail(userId, existing.id);
    }

    await this.assertCanAccessThread(userId, otherUserId);

    const conversation = await this.prisma.conversation.create({
      data: { participantAId, participantBId },
    });

    return this.getConversationDetail(userId, conversation.id);
  }

  async seedInvitationMessage(fromUserId: string, toUserId: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) return null;

    const [participantAId, participantBId] = orderedParticipants(fromUserId, toUserId);
    const conversation = await this.prisma.conversation.upsert({
      where: {
        participantAId_participantBId: { participantAId, participantBId },
      },
      create: { participantAId, participantBId, lastMessageAt: new Date() },
      update: { lastMessageAt: new Date() },
    });

    const existing = await this.prisma.message.findFirst({
      where: { conversationId: conversation.id, senderId: fromUserId, body: trimmed },
    });
    if (existing) return existing;

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: fromUserId,
        body: trimmed,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });

    return message;
  }

  async listConversations(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [{ participantAId: userId }, { participantBId: userId }],
    };

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const otherIds = items.map((c) =>
      c.participantAId === userId ? c.participantBId : c.participantAId,
    );
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: otherIds } },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const unreadCounts = await Promise.all(
      items.map((c) =>
        this.prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            readAt: null,
          },
        }),
      ),
    );

    return {
      items: items.map((c, index) => {
        const otherUserId = c.participantAId === userId ? c.participantBId : c.participantAId;
        const lastMessage = c.messages[0] ?? null;
        return {
          id: c.id,
          otherUser: this.mapParticipant(profileMap.get(otherUserId) ?? null, otherUserId),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                body: lastMessage.body,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
                isMine: lastMessage.senderId === userId,
              }
            : null,
          unreadCount: unreadCounts[index],
          updatedAt: c.lastMessageAt ?? c.updatedAt,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getConversationDetail(userId: string, conversationId: string) {
    const conversation = await this.getConversationForUser(userId, conversationId);
    const otherUserId =
      conversation.participantAId === userId
        ? conversation.participantBId
        : conversation.participantAId;

    await this.assertCanViewThread(userId, otherUserId);

    const profile = await this.prisma.profile.findUnique({
      where: { userId: otherUserId },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });

    const connection = await this.findConnection(userId, otherUserId);

    return {
      id: conversation.id,
      otherUser: this.mapParticipant(profile, otherUserId),
      ...this.mapConnectionContext(userId, connection),
    };
  }

  async listMessages(userId: string, conversationId: string, page = 1, limit = 50) {
    const conversation = await this.getConversationForUser(userId, conversationId);
    const otherUserId =
      conversation.participantAId === userId
        ? conversation.participantBId
        : conversation.participantAId;
    await this.assertCanViewThread(userId, otherUserId);

    const skip = (page - 1) * limit;
    const where = { conversationId };

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where }),
    ]);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return {
      items: items.map((m) => this.mapMessageItem(m, userId)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    body: string,
    file?: MessageFile,
  ) {
    const trimmed = body.trim();
    if (!trimmed && !file) {
      throw new BadRequestException('Message cannot be empty');
    }

    const conversation = await this.getConversationForUser(userId, conversationId);
    const otherUserId =
      conversation.participantAId === userId
        ? conversation.participantBId
        : conversation.participantAId;
    await this.assertConnected(userId, otherUserId);

    const attachment = file ? this.saveAttachment(file) : null;
    const messageBody = trimmed || `📎 ${attachment?.attachmentFileName ?? 'Attachment'}`;

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: messageBody,
        attachmentUrl: attachment?.attachmentUrl ?? null,
        attachmentFileName: attachment?.attachmentFileName ?? null,
        attachmentMimeType: attachment?.attachmentMimeType ?? null,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    const sender = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    const senderName = sender ? publicDisplayName(sender) : 'Someone';
    const preview = attachment
      ? `${senderName} sent a file: ${attachment.attachmentFileName}`
      : `${senderName}: ${messageBody.length > 80 ? `${messageBody.slice(0, 80)}…` : messageBody}`;

    await this.notifications.create({
      userId: otherUserId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'New message',
      body: preview,
      linkUrl: `/messages?conversation=${conversationId}`,
      metadata: { conversationId, messageId: message.id, fromUserId: userId },
    });

    return this.mapMessageItem(message, userId);
  }

  async sendMessageToUser(
    userId: string,
    otherUserId: string,
    body: string,
    file?: MessageFile,
  ) {
    const detail = await this.getOrCreateConversation(userId, otherUserId);
    return this.sendMessage(userId, detail.id, body, file);
  }
}
