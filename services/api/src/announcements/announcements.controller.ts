import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { AnnouncementsService } from './announcements.service';
import { UpsertAnnouncementDto } from './dto/announcements.dto';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcements: AnnouncementsService) {}

  @Get('active')
  getActive() {
    return this.announcements.getActivePublic();
  }

  @Get()
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  listAdmin() {
    return this.announcements.listAdmin();
  }

  @Post('image')
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    return this.announcements.uploadImage(file);
  }

  @Post()
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  create(@Body() dto: UpsertAnnouncementDto) {
    return this.announcements.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpsertAnnouncementDto) {
    return this.announcements.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.announcements.remove(id);
  }
}
