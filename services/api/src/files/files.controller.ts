import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { MediaAuthGuard, type MediaJwtPayload } from './media-auth.guard';

@ApiTags('media')
@Controller('media')
@SkipThrottle()
export class FilesController {
  constructor(private files: FilesService) {}

  @Get(':category/:filename')
  @UseGuards(MediaAuthGuard)
  @ApiBearerAuth()
  async getFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Req() req: { user?: MediaJwtPayload },
    @Res() res: Response,
  ) {
    const file = await this.files.authorizeAndResolve(category, filename, req.user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', file.contentDisposition);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    file.stream.pipe(res);
  }
}
