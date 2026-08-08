import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import { messageAttachmentTooLargeMessage } from '../../messages/message-attachment.limits';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(HttpStatus.BAD_REQUEST).json({
        message: messageAttachmentTooLargeMessage(),
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      message: exception.message || 'Upload failed',
    });
  }
}
