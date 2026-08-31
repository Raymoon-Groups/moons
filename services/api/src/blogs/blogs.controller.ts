import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  listAdmin() {
    return this.blogs.listAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  getAdmin(@Param('id') id: string) {
    return this.blogs.getAdmin(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogs.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogs.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.blogs.remove(id);
  }

  @Get(':slug')
  getPublic(@Param('slug') slug: string) {
    return this.blogs.getPublicBySlug(slug);
  }
}
