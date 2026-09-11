import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MAX_POST_IMAGES, MAX_POST_VIDEO_BYTES } from './post-media.limits';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { THROTTLE } from '../common/throttle.constants';
import { CreateCommentDto, CreatePostDto, SharePostDto, UpdatePostDto } from './dto/posts.dto';
import { PostsService } from './posts.service';

const POST_UPLOAD_DIR = join(process.cwd(), 'uploads', 'posts');

function ensurePostUploadDir() {
  if (!existsSync(POST_UPLOAD_DIR)) {
    mkdirSync(POST_UPLOAD_DIR, { recursive: true });
  }
}

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard, OnboardingGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private posts: PostsService) {}

  @Get('feed')
  feed(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posts.getFeed(user.sub, Number(page) || 1, Number(limit) || 20);
  }

  @Get('user/:userId')
  userPosts(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posts.getUserPosts(user.sub, userId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.posts.getPost(user.sub, id);
  }

  @Post()
  @Throttle(THROTTLE.createPost)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        body: { type: 'string' },
        media: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('media', MAX_POST_IMAGES, {
      // Disk storage avoids loading large videos into RAM.
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensurePostUploadDir();
          cb(null, POST_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '').toLowerCase() || '.bin';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_POST_VIDEO_BYTES },
    }),
  )
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePostDto,
    @UploadedFiles() media?: Express.Multer.File[],
  ) {
    return this.posts.createPost(user.sub, dto.body, media ?? []);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.posts.deletePost(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.posts.updatePost(user.sub, id, dto.body);
  }

  @Post(':id/like')
  @Throttle(THROTTLE.engage)
  like(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.posts.likePost(user.sub, id);
  }

  @Delete(':id/like')
  @Throttle(THROTTLE.engage)
  unlike(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.posts.unlikePost(user.sub, id);
  }

  @Get(':id/likes')
  likes(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posts.listLikes(user.sub, id, Number(page) || 1, Number(limit) || 30);
  }

  @Get(':id/comments')
  comments(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posts.listComments(user.sub, id, Number(page) || 1, Number(limit) || 30);
  }

  @Post(':id/comments')
  @Throttle(THROTTLE.engage)
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
  addComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.posts.addComment(user.sub, id, dto.body, attachment);
  }

  @Delete(':id/comments/:commentId')
  deleteComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.posts.deleteComment(user.sub, id, commentId);
  }

  @Post(':id/comments/:commentId/hide')
  hideComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.posts.hideComment(user.sub, id, commentId);
  }

  @Post(':id/comments/:commentId/unhide')
  unhideComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.posts.unhideComment(user.sub, id, commentId);
  }

  @Post(':id/share')
  @Throttle(THROTTLE.engage)
  share(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SharePostDto,
  ) {
    return this.posts.sharePost(user.sub, id, dto.body);
  }
}
