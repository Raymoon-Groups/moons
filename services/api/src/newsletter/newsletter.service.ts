import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private emailService: EmailService) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.trim().toLowerCase();
    await this.emailService.sendNewsletterWelcomeEmail(email);
    return {
      success: true,
      message: 'Thanks — you are on the list!',
    };
  }
}
