import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard, OnboardingGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get('conversations')
  listConversations(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.listConversations(user.sub, Number(page) || 1, Number(limit) || 30);
  }

  @Get('conversations/with/:userId')
  conversationWithUser(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.messages.getOrCreateConversation(user.sub, userId);
  }

  @Get('conversations/:id')
  getConversation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.messages.getConversationDetail(user.sub, id);
  }

  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.listMessages(user.sub, id, Number(page) || 1, Number(limit) || 50);
  }

  @Post('conversations/:id/messages')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        body: { type: 'string' },
        attachment: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.messages.sendMessage(user.sub, id, dto.body ?? '', attachment);
  }

  @Post('with/:userId')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        body: { type: 'string' },
        attachment: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  sendToUser(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Body() dto: SendMessageDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.messages.sendMessageToUser(user.sub, userId, dto.body ?? '', attachment);
  }
}
