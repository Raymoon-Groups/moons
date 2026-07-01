import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }
}
