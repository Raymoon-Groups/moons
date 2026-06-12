import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
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
    });
  }
}
