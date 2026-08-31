import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing && !existing.unsubscribed) {
      return {
        success: true,
        message: 'You are already subscribed.',
      };
    }

    if (existing?.unsubscribed) {
      await this.prisma.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribed: false },
      });
    } else {
      await this.prisma.newsletterSubscriber.create({ data: { email } });
    }

    await this.emailService.sendNewsletterWelcomeEmail(email);
    return {
      success: true,
      message: 'Thanks — you are on the list!',
    };
  }

  async listSubscribers() {
    const items = await this.prisma.newsletterSubscriber.findMany({
      where: { unsubscribed: false },
      orderBy: { createdAt: 'desc' },
    });
    return {
      total: items.length,
      items: items.map((item) => ({
        id: item.id,
        email: item.email,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
