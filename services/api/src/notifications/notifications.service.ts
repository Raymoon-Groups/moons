import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationStatus,
  ConnectionStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export const NETWORK_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.CONNECTION_REQUEST,
  NotificationType.CONNECTION_ACCEPTED,
  NotificationType.PROFILE_VIEW,
  NotificationType.NETWORK_SUGGESTION,
];

export const BELL_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.APPLICATION_RECEIVED,
  NotificationType.APPLICATION_SUBMITTED,
  NotificationType.APPLICATION_VIEWED,
  NotificationType.APPLICATION_SHORTLISTED,
  NotificationType.APPLICATION_REJECTED,
  NotificationType.PROFILE_VIEW,
  NotificationType.CONNECTION_REQUEST,
  NotificationType.CONNECTION_ACCEPTED,
  NotificationType.POST_LIKE,
  NotificationType.POST_COMMENT,
  NotificationType.POST_SHARE,
  NotificationType.POST_CREATED,
  NotificationType.POST_MENTION,
];

/** User-to-user types that are easy to spam. */
const SOCIAL_ABUSE_TYPES = new Set<NotificationType>([
  NotificationType.MESSAGE_RECEIVED,
  NotificationType.CONNECTION_REQUEST,
  NotificationType.PROFILE_VIEW,
  NotificationType.POST_LIKE,
  NotificationType.POST_COMMENT,
  NotificationType.POST_SHARE,
  NotificationType.POST_CREATED,
  NotificationType.POST_MENTION,
  NotificationType.NETWORK_SUGGESTION,
]);

const HOUR_SECONDS = 60 * 60;
/** Max social notifications one user can generate toward one recipient / hour. */
const PAIR_LIMIT_PER_HOUR = 25;
/** Max social notifications one user can generate overall / hour. */
const ACTOR_LIMIT_PER_HOUR = 100;

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Prisma.InputJsonValue;
  /** Acting user (sender / liker / viewer). Used for block + rate checks. */
  actorId?: string;
  /** Skip abuse checks (system / transactional only). */
  skipAbuseChecks?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(input: CreateNotificationInput) {
    const actorId = input.actorId ?? this.extractActorId(input.metadata);

    if (!input.skipAbuseChecks && actorId && actorId !== input.userId) {
      if (await this.isBlockedEitherWay(actorId, input.userId)) {
        return null;
      }

      if (SOCIAL_ABUSE_TYPES.has(input.type)) {
        if (await this.hitLimit(`notify:pair:${actorId}:${input.userId}`, PAIR_LIMIT_PER_HOUR, HOUR_SECONDS)) {
          return null;
        }
        if (await this.hitLimit(`notify:actor:${actorId}`, ACTOR_LIMIT_PER_HOUR, HOUR_SECONDS)) {
          return null;
        }
      }
    }

    // Collapse unread message pings for the same conversation into one row.
    if (
      input.type === NotificationType.MESSAGE_RECEIVED &&
      input.metadata &&
      typeof input.metadata === 'object' &&
      !Array.isArray(input.metadata)
    ) {
      const conversationId = (input.metadata as Record<string, unknown>).conversationId;
      if (typeof conversationId === 'string' && conversationId) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: input.userId,
            type: NotificationType.MESSAGE_RECEIVED,
            readAt: null,
            metadata: {
              path: ['conversationId'],
              equals: conversationId,
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (existing) {
          return this.prisma.notification.update({
            where: { id: existing.id },
            data: {
              title: input.title,
              body: input.body,
              linkUrl: input.linkUrl ?? existing.linkUrl,
              metadata: input.metadata ?? existing.metadata ?? {},
              createdAt: new Date(),
            },
          });
        }
      }
    }

    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        linkUrl: input.linkUrl ?? null,
        metadata: input.metadata ?? {},
      },
    });
  }

  private extractActorId(metadata?: Prisma.InputJsonValue): string | undefined {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return undefined;
    }
    const record = metadata as Record<string, unknown>;
    for (const key of ['fromUserId', 'viewerId', 'actorId', 'senderId']) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    return undefined;
  }

  private async isBlockedEitherWay(userA: string, userB: string) {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
      select: { blockerId: true },
    });
    return Boolean(block);
  }

  /** @returns true when the limit is exceeded (caller should drop the action). */
  private async hitLimit(key: string, limit: number, ttlSeconds: number) {
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return count > limit;
    } catch {
      // If Redis is down, allow the notification rather than breaking core flows.
      return false;
    }
  }

  /** Remove stale connection-request notifications after accept / ignore / cancel. */
  async dismissConnectionRequestNotifications(userId: string, connectionId: string) {
    await this.prisma.notification.deleteMany({
      where: {
        userId,
        type: NotificationType.CONNECTION_REQUEST,
        metadata: {
          path: ['connectionId'],
          equals: connectionId,
        },
      },
    });
  }

  async listForUser(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async navIndicators(userId: string) {
    const [
      networkNotificationCount,
      pendingInviteCount,
      unreadMessageCount,
      bellCount,
    ] = await Promise.all([
      this.prisma.notification.count({
        where: {
          userId,
          readAt: null,
          type: { in: NETWORK_NOTIFICATION_TYPES },
        },
      }),
      this.prisma.connection.count({
        where: { toUserId: userId, status: ConnectionStatus.PENDING },
      }),
      this.prisma.message.count({
        where: {
          senderId: { not: userId },
          readAt: null,
          conversation: {
            OR: [{ participantAId: userId }, { participantBId: userId }],
          },
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          readAt: null,
          type: { in: BELL_NOTIFICATION_TYPES },
        },
      }),
    ]);

    return {
      network: networkNotificationCount > 0 || pendingInviteCount > 0,
      networkPendingCount: pendingInviteCount,
      networkNotificationCount: networkNotificationCount,
      messages: unreadMessageCount > 0,
      bell: bellCount > 0,
    };
  }

  async markNetworkNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        type: { in: NETWORK_NOTIFICATION_TYPES },
      },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async listBellNotifications(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId, type: { in: BELL_NOTIFICATION_TYPES } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markBellNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        type: { in: BELL_NOTIFICATION_TYPES },
      },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.readAt) {
      return notification;
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async notifyApplicationSubmitted(
    candidateId: string,
    jobTitle: string,
    companyName: string,
    jobId: string,
  ) {
    return this.create({
      userId: candidateId,
      type: NotificationType.APPLICATION_SUBMITTED,
      title: 'Application submitted',
      body: `Your application for ${jobTitle} at ${companyName} was submitted successfully.`,
      linkUrl: '/applications',
      metadata: { jobId },
      skipAbuseChecks: true,
    });
  }

  async notifyApplicationReceived(
    recruiterId: string,
    candidateName: string,
    jobTitle: string,
    jobId: string,
  ) {
    return this.create({
      userId: recruiterId,
      type: NotificationType.APPLICATION_RECEIVED,
      title: 'New application received',
      body: `${candidateName} applied for ${jobTitle}.`,
      linkUrl: `/recruiter/jobs/${jobId}/applicants`,
      metadata: { jobId },
      skipAbuseChecks: true,
    });
  }

  async notifyApplicationViewed(
    candidateId: string,
    jobTitle: string,
    companyName: string,
  ) {
    return this.create({
      userId: candidateId,
      type: NotificationType.APPLICATION_VIEWED,
      title: 'Application viewed',
      body: `Your application for ${jobTitle} at ${companyName} was viewed by the recruiter.`,
      linkUrl: '/applications',
      skipAbuseChecks: true,
    });
  }

  async notifyApplicationStatus(
    candidateId: string,
    jobTitle: string,
    companyName: string,
    status: ApplicationStatus,
  ) {
    if (status === ApplicationStatus.SUBMITTED) return null;

    const typeMap: Partial<Record<ApplicationStatus, NotificationType>> = {
      [ApplicationStatus.VIEWED]: NotificationType.APPLICATION_VIEWED,
      [ApplicationStatus.SHORTLISTED]: NotificationType.APPLICATION_SHORTLISTED,
      [ApplicationStatus.REJECTED]: NotificationType.APPLICATION_REJECTED,
    };

    const titleMap: Partial<Record<ApplicationStatus, string>> = {
      [ApplicationStatus.VIEWED]: 'Application viewed',
      [ApplicationStatus.SHORTLISTED]: 'You have been shortlisted',
      [ApplicationStatus.REJECTED]: 'Application update',
    };

    const bodyMap: Partial<Record<ApplicationStatus, string>> = {
      [ApplicationStatus.VIEWED]: `Your application for ${jobTitle} at ${companyName} was viewed by the recruiter.`,
      [ApplicationStatus.SHORTLISTED]: `Great news! You were shortlisted for ${jobTitle} at ${companyName}.`,
      [ApplicationStatus.REJECTED]: `Your application for ${jobTitle} at ${companyName} was not selected at this time.`,
    };

    const type = typeMap[status];
    const title = titleMap[status];
    const body = bodyMap[status];
    if (!type || !title || !body) return null;

    return this.create({
      userId: candidateId,
      type,
      title,
      body,
      linkUrl: '/applications',
      metadata: { status },
      skipAbuseChecks: true,
    });
  }
}
