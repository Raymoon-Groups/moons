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
import type { Request, Response } from 'express';
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
    @Req() req: Request & { user?: MediaJwtPayload },
    @Res() res: Response,
  ) {
    const file = await this.files.authorizeAndResolve(category, filename, req.user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', file.contentDisposition);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'bytes');

    const rangeHeader = req.headers.range;
    if (rangeHeader && file.size > 0) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : file.size - 1;
        if (
          Number.isFinite(start) &&
          Number.isFinite(end) &&
          start >= 0 &&
          end >= start &&
          start < file.size
        ) {
          const safeEnd = Math.min(end, file.size - 1);
          const chunkSize = safeEnd - start + 1;
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${safeEnd}/${file.size}`);
          res.setHeader('Content-Length', chunkSize);
          file.createStream(start, safeEnd).pipe(res);
          return;
        }
      }
    }

    res.setHeader('Content-Length', file.size);
    file.createStream().pipe(res);
  }
}
