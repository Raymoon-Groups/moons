import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogSection, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blogs.dto';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

@Injectable()
export class BlogsService {
  constructor(private prisma: PrismaService) {}

  private serialize(post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    category: string;
    section: BlogSection;
    coverImageUrl: string | null;
    readTimeMinutes: number;
    published: boolean;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      category: post.category,
      section: post.section,
      coverImageUrl: post.coverImageUrl,
      readTimeMinutes: post.readTimeMinutes,
      readTime: `${post.readTimeMinutes} min read`,
      published: post.published,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      date: (post.publishedAt ?? post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };
  }

  async listPublic() {
    const posts = await this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return posts.map((post) => this.serialize(post));
  }

  async getPublicBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, published: true },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return this.serialize(post);
  }

  async listAdmin() {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: [{ updatedAt: 'desc' }],
    });
    return posts.map((post) => this.serialize(post));
  }

  async getAdmin(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');
    return this.serialize(post);
  }

  private async uniqueSlug(base: string, excludeId?: string) {
    const root = slugify(base) || `post-${Date.now()}`;
    let candidate = root;
    let i = 2;
    while (true) {
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug: candidate },
      });
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${root}-${i++}`;
    }
  }

  async create(dto: CreateBlogPostDto) {
    const title = dto.title.trim();
    if (!title) throw new BadRequestException('Title is required');
    const slug = await this.uniqueSlug(dto.slug?.trim() || title);
    const published = Boolean(dto.published);

    if (dto.section === BlogSection.FEATURED && published) {
      await this.prisma.blogPost.updateMany({
        where: { section: BlogSection.FEATURED, published: true },
        data: { section: BlogSection.LATEST },
      });
    }

    const post = await this.prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: dto.excerpt?.trim() ?? '',
        body: dto.body?.trim() ?? '',
        category: dto.category?.trim() || 'General',
        section: dto.section ?? BlogSection.LATEST,
        coverImageUrl: dto.coverImageUrl?.trim() || null,
        readTimeMinutes: dto.readTimeMinutes ?? 5,
        published,
        publishedAt: published ? new Date() : null,
      },
    });
    return this.serialize(post);
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Blog post not found');

    const data: Prisma.BlogPostUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt.trim();
    if (dto.body !== undefined) data.body = dto.body.trim();
    if (dto.category !== undefined) data.category = dto.category.trim() || 'General';
    if (dto.section !== undefined) data.section = dto.section;
    if (dto.coverImageUrl !== undefined) {
      data.coverImageUrl = dto.coverImageUrl?.trim() || null;
    }
    if (dto.readTimeMinutes !== undefined) data.readTimeMinutes = dto.readTimeMinutes;
    if (dto.slug !== undefined) {
      data.slug = await this.uniqueSlug(dto.slug.trim() || existing.title, id);
    }
    if (dto.published !== undefined) {
      data.published = dto.published;
      if (dto.published && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
      if (!dto.published) {
        data.publishedAt = null;
      }
    }

    const nextSection = dto.section ?? existing.section;
    const willPublish =
      dto.published !== undefined ? dto.published : existing.published;
    if (nextSection === BlogSection.FEATURED && willPublish) {
      await this.prisma.blogPost.updateMany({
        where: {
          section: BlogSection.FEATURED,
          published: true,
          NOT: { id },
        },
        data: { section: BlogSection.LATEST },
      });
    }

    const post = await this.prisma.blogPost.update({ where: { id }, data });
    return this.serialize(post);
  }

  async remove(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Blog post not found');
    await this.prisma.blogPost.delete({ where: { id } });
    return { success: true };
  }
}
