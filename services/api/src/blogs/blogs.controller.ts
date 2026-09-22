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
import { BlogsService } from './blogs.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blogs.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private blogs: BlogsService) {}

  @Get()
  listPublic() {
    return this.blogs.listPublic();
  }

  @Get('admin/all')
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  listAdmin() {
    return this.blogs.listAdmin();
  }

  @Get('admin/:id')
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  getAdmin(@Param('id') id: string) {
    return this.blogs.getAdmin(id);
  }

  @Post('cover')
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
  uploadCover(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    return this.blogs.uploadCoverImage(file);
  }

  @Post()
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogs.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogs.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.blogs.remove(id);
  }

  @Get(':slug')
  getPublic(@Param('slug') slug: string) {
    return this.blogs.getPublicBySlug(slug);
  }
}
