import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SendConnectionDto } from './dto/send-connection.dto';
import {
  connectionWhereEither,
  publicDisplayName,
  publicHeadline,
  ProfileWithUser,
} from './network.utils';

const DAILY_REQUEST_LIMIT = 20;

const CONNECTION_STATUS_PRIORITY: Record<ConnectionStatus, number> = {
  [ConnectionStatus.ACCEPTED]: 4,
  [ConnectionStatus.PENDING]: 3,
  [ConnectionStatus.REJECTED]: 2,
  [ConnectionStatus.CANCELLED]: 1,
};

@Injectable()
export class ConnectionsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private redis: RedisService,
  ) {}

  private async assertNotBlocked(userA: string, userB: string) {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    if (block) {
      throw new ForbiddenException('You cannot connect with this user');
    }
  }

  private async enforceRateLimit(userId: string) {
    const key = `network:requests:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 86_400);
    }
    if (count > DAILY_REQUEST_LIMIT) {
      throw new BadRequestException(
        `Daily connection request limit reached (${DAILY_REQUEST_LIMIT})`,
      );
    }
  }

  private async findExistingConnection(fromUserId: string, toUserId: string) {
    const connections = await this.prisma.connection.findMany({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });

    if (!connections.length) return null;

    return connections.sort(
      (a, b) =>
        CONNECTION_STATUS_PRIORITY[b.status] - CONNECTION_STATUS_PRIORITY[a.status],
    )[0];
  }

  private mapConnectionUser(profile: ProfileWithUser | null, userId: string) {
    if (!profile) {
      return { userId, fullName: null, headline: null, avatarUrl: null, role: null };
    }
    return {
      userId: profile.userId,
      fullName: publicDisplayName(profile),
      headline: publicHeadline(profile),
      avatarUrl: profile.avatarUrl,
      role: profile.user.role,
      currentCompany: profile.currentCompany,
      location: profile.location,
    };
  }

  async sendRequest(fromUserId: string, dto: SendConnectionDto) {
    if (fromUserId === dto.toUserId) {
      throw new BadRequestException('You cannot connect with yourself');
    }

    const target = await this.prisma.profile.findUnique({
      where: { userId: dto.toUserId },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    await this.assertNotBlocked(fromUserId, dto.toUserId);
    await this.enforceRateLimit(fromUserId);

    const existing = await this.findExistingConnection(fromUserId, dto.toUserId);
    if (existing) {
      if (existing.status === ConnectionStatus.ACCEPTED) {
        throw new BadRequestException('You are already connected');
      }
      if (existing.status === ConnectionStatus.PENDING) {
        throw new BadRequestException('A connection request already exists');
      }
      if (
        existing.status === ConnectionStatus.REJECTED &&
        existing.fromUserId === fromUserId
      ) {
        throw new BadRequestException('Your previous request was declined');
      }
    }

    const sender = await this.prisma.profile.findUnique({
      where: { userId: fromUserId },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });

    const connection =
      existing &&
      (existing.status === ConnectionStatus.REJECTED ||
        existing.status === ConnectionStatus.CANCELLED)
        ? await this.prisma.connection.update({
            where: { id: existing.id },
            data: {
              fromUserId,
              toUserId: dto.toUserId,
              status: ConnectionStatus.PENDING,
              message: dto.message?.trim() || null,
              respondedAt: null,
            },
          })
        : await this.prisma.connection.create({
            data: {
              fromUserId,
              toUserId: dto.toUserId,
              message: dto.message?.trim() || null,
              status: ConnectionStatus.PENDING,
            },
          });

    const senderName = sender ? publicDisplayName(sender) : 'Someone';
    await this.notifications.create({
      userId: dto.toUserId,
      type: NotificationType.CONNECTION_REQUEST,
      title: 'New connection request',
      body: `${senderName} wants to connect with you.`,
      linkUrl: '/profile',
      metadata: { connectionId: connection.id, fromUserId },
    });

    return connection;
  }

  async acceptRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    if (!connection || connection.toUserId !== userId) {
      throw new NotFoundException('Connection request not found');
    }
    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('This request is no longer pending');
    }

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: ConnectionStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    const accepter = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    const accepterName = accepter ? publicDisplayName(accepter) : 'Someone';

    await this.notifications.create({
      userId: connection.fromUserId,
      type: NotificationType.CONNECTION_ACCEPTED,
      title: 'Connection accepted',
      body: `${accepterName} accepted your connection request.`,
      linkUrl: `/network/${userId}`,
      metadata: { connectionId, userId },
    });

    return updated;
  }

  async rejectRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    if (!connection || connection.toUserId !== userId) {
      throw new NotFoundException('Connection request not found');
    }
    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('This request is no longer pending');
    }

    return this.prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: ConnectionStatus.REJECTED,
        respondedAt: new Date(),
      },
    });
  }

  async cancelRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    if (!connection || connection.fromUserId !== userId) {
      throw new NotFoundException('Connection request not found');
    }
    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.CANCELLED },
    });
  }

  async removeConnection(userId: string, otherUserId: string) {
    const connection = await this.findExistingConnection(userId, otherUserId);
    if (!connection || connection.status !== ConnectionStatus.ACCEPTED) {
      throw new NotFoundException('Connection not found');
    }

    return this.prisma.connection.delete({ where: { id: connection.id } });
  }

  async getStatus(userId: string, otherUserId: string) {
    const connection = await this.findExistingConnection(userId, otherUserId);
    if (!connection) {
      return { status: 'NONE' as const, connectionId: null, direction: null };
    }

    let direction: 'sent' | 'received' | null = null;
    if (connection.status === ConnectionStatus.PENDING) {
      direction = connection.fromUserId === userId ? 'sent' : 'received';
    }

    return {
      status: connection.status,
      connectionId: connection.id,
      direction,
    };
  }

  async listConnections(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      status: ConnectionStatus.ACCEPTED,
      ...connectionWhereEither(userId),
    };

    const [items, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({ where }),
    ]);

    const otherIds = items.map((c) =>
      c.fromUserId === userId ? c.toUserId : c.fromUserId,
    );
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: otherIds } },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return {
      items: items.map((c) => {
        const otherUserId = c.fromUserId === userId ? c.toUserId : c.fromUserId;
        return {
          connectionId: c.id,
          connectedAt: c.respondedAt ?? c.updatedAt,
          user: {
            ...this.mapConnectionUser(profileMap.get(otherUserId) ?? null, otherUserId),
            connectionStatus: 'ACCEPTED' as const,
            connectionId: c.id,
          },
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listPendingReceived(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { toUserId: userId, status: ConnectionStatus.PENDING };

    const [items, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({ where }),
    ]);

    const senderIds = items.map((c) => c.fromUserId);
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: senderIds } },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return {
      items: items.map((c) => ({
        id: c.id,
        message: c.message,
        createdAt: c.createdAt,
        fromUser: this.mapConnectionUser(profileMap.get(c.fromUserId) ?? null, c.fromUserId),
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listPendingSent(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { fromUserId: userId, status: ConnectionStatus.PENDING };

    const [items, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({ where }),
    ]);

    const targetIds = items.map((c) => c.toUserId);
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: targetIds } },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return {
      items: items.map((c) => ({
        id: c.id,
        message: c.message,
        createdAt: c.createdAt,
        toUser: this.mapConnectionUser(profileMap.get(c.toUserId) ?? null, c.toUserId),
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listRecentlyConnected(userId: string, limit = 10) {
    const result = await this.listConnections(userId, 1, limit);
    return result.items;
  }

  async countConnections(userId: string) {
    return this.prisma.connection.count({
      where: {
        status: ConnectionStatus.ACCEPTED,
        ...connectionWhereEither(userId),
      },
    });
  }

  async getMutualConnections(userId: string, otherUserId: string, limit = 10) {
    const myConnections = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      select: { fromUserId: true, toUserId: true },
    });

    const mySet = new Set(
      myConnections.map((c) => (c.fromUserId === userId ? c.toUserId : c.fromUserId)),
    );

    const theirConnections = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ fromUserId: otherUserId }, { toUserId: otherUserId }],
      },
      select: { fromUserId: true, toUserId: true },
    });

    const mutualIds = theirConnections
      .map((c) => (c.fromUserId === otherUserId ? c.toUserId : c.fromUserId))
      .filter((id) => mySet.has(id) && id !== userId && id !== otherUserId)
      .slice(0, limit);

    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: mutualIds } },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });

    return {
      count: mutualIds.length,
      items: profiles.map((p) => this.mapConnectionUser(p, p.userId)),
    };
  }

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const connection = await this.findExistingConnection(blockerId, blockedId);
    if (connection) {
      await this.prisma.connection.delete({ where: { id: connection.id } });
    }

    return this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId, reason: reason?.trim() || null },
      update: { reason: reason?.trim() || null },
    });
  }

  async getNetworkStats(userId: string) {
    const [connections, pendingReceived, pendingSent] = await Promise.all([
      this.countConnections(userId),
      this.prisma.connection.count({
        where: { toUserId: userId, status: ConnectionStatus.PENDING },
      }),
      this.prisma.connection.count({
        where: { fromUserId: userId, status: ConnectionStatus.PENDING },
      }),
    ]);

    return { connections, pendingReceived, pendingSent };
  }
}
