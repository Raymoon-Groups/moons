import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAnnouncementDto } from './dto/announcements.dto';

const ANNOUNCEMENT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'announcements');
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  private serialize(item: {
    id: string;
    title: string;
    body: string;
    ctaLabel: string | null;
    ctaUrl: string | null;
    imageUrl: string | null;
    active: boolean;
    durationSec: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      ctaLabel: item.ctaLabel,
      ctaUrl: item.ctaUrl,
      imageUrl: item.imageUrl,
      active: item.active,
      durationSec: item.durationSec,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private extFromMime(mime: string): string | null {
    switch (mime) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      default:
        return null;
    }
  }

  async uploadImage(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }) {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, WEBP, or GIF images are allowed');
    }
    if (file.buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }

    if (!existsSync(ANNOUNCEMENT_UPLOAD_DIR)) {
      mkdirSync(ANNOUNCEMENT_UPLOAD_DIR, { recursive: true });
    }

    const ext =
      this.extFromMime(file.mimetype) ??
      (extname(file.originalname).toLowerCase() || '.jpg');
    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(ANNOUNCEMENT_UPLOAD_DIR, filename), file.buffer);

    return { imageUrl: `/uploads/announcements/${filename}` };
  }

  async getActivePublic() {
    try {
      const items = await this.prisma.siteAnnouncement.findMany({
        where: { active: true },
        orderBy: { updatedAt: 'desc' },
      });
      return items.map((item) => this.serialize(item));
    } catch {
      // Table may be missing before migrate; don't break the landing page.
      return [];
    }
  }

  async listAdmin() {
    const items = await this.prisma.siteAnnouncement.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return items.map((item) => this.serialize(item));
  }

  async create(dto: UpsertAnnouncementDto) {
    const item = await this.prisma.siteAnnouncement.create({
      data: {
        title: dto.title.trim(),
        body: dto.body?.trim() ?? '',
        ctaLabel: dto.ctaLabel?.trim() || null,
        ctaUrl: dto.ctaUrl?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
        active: Boolean(dto.active),
        durationSec: dto.durationSec ?? 5,
      },
    });
    return this.serialize(item);
  }

  async update(id: string, dto: UpsertAnnouncementDto) {
    const existing = await this.prisma.siteAnnouncement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Announcement not found');

    const item = await this.prisma.siteAnnouncement.update({
      where: { id },
      data: {
        title: dto.title.trim(),
        body: dto.body?.trim() ?? '',
        ctaLabel: dto.ctaLabel?.trim() || null,
        ctaUrl: dto.ctaUrl?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
        active: dto.active !== undefined ? Boolean(dto.active) : existing.active,
        durationSec: dto.durationSec ?? existing.durationSec,
      },
    });
    return this.serialize(item);
  }

  async remove(id: string) {
    const existing = await this.prisma.siteAnnouncement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Announcement not found');
    await this.prisma.siteAnnouncement.delete({ where: { id } });
    return { success: true };
  }
}
