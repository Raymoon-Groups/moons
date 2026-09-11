import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { messageAttachmentTooLargeMessage } from '../../messages/message-attachment.limits';
import { postMediaTooLargeMessage } from '../../posts/post-media.limits';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      const path = (request.originalUrl || request.url || '').split('?')[0];
      // POST /posts is feed media; /posts/:id/comments and /messages use attachment limits.
      const isFeedPostUpload = /\/posts\/?$/.test(path);
      response.status(HttpStatus.BAD_REQUEST).json({
        message: isFeedPostUpload
          ? postMediaTooLargeMessage()
          : messageAttachmentTooLargeMessage(),
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      message: exception.message || 'Upload failed',
    });
  }
}
