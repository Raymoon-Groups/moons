import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, role: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return this.toProfileResponse(profile);
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.headline !== undefined) data.headline = dto.headline.trim() || null;
    if (dto.currentCompany !== undefined) {
      data.currentCompany = dto.currentCompany.trim() || null;
    }
    if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;
    if (dto.location !== undefined) data.location = dto.location.trim() || null;
    if (dto.noticePeriod !== undefined) data.noticePeriod = dto.noticePeriod || null;
    if (dto.summary !== undefined) data.summary = dto.summary.trim() || null;
    if (dto.skills !== undefined) data.skills = dto.skills;

    const updated = await this.prisma.profile.update({
      where: { userId },
      data,
      include: { user: { select: { email: true, role: true } } },
    });
    return this.toProfileResponse(updated);
  }

  async removeAvatar(userId: string) {
    this.deleteAllAvatars(userId);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl: null },
      include: { user: { select: { email: true, role: true } } },
    });
    return this.toProfileResponse(updated);
  }

  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, or WEBP images are allowed');
    }
    if (file.buffer.length > MAX_BYTES) {
      throw new BadRequestException('Image must be 2 MB or smaller');
    }

    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const ext =
      this.extFromMime(file.mimetype) ??
      (extname(file.originalname).toLowerCase() || '.jpg');
    const filename = `${userId}${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    this.deleteAllAvatars(userId);
    writeFileSync(filepath, file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
      include: { user: { select: { email: true, role: true } } },
    });

    return this.toProfileResponse(updated);
  }

  private deleteAllAvatars(userId: string) {
    if (!existsSync(UPLOAD_DIR)) return;
    for (const name of readdirSync(UPLOAD_DIR)) {
      if (name.startsWith(userId)) {
        unlinkSync(join(UPLOAD_DIR, name));
      }
    }
  }

  private extFromMime(mime: string) {
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    return null;
  }

  private toProfileResponse(
    profile: {
      id: string;
      userId: string;
      fullName: string | null;
      avatarUrl: string | null;
      phone: string | null;
      headline: string | null;
      currentCompany: string | null;
      experienceYears: number | null;
      location: string | null;
      noticePeriod: string | null;
      summary: string | null;
      skills: string[];
      createdAt: Date;
      updatedAt: Date;
      user: { email: string; role: string };
    },
  ) {
    return {
      id: profile.id,
      userId: profile.userId,
      email: profile.user.email,
      role: profile.user.role,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      phone: profile.phone,
      headline: profile.headline,
      currentCompany: profile.currentCompany,
      experienceYears: profile.experienceYears,
      location: profile.location,
      noticePeriod: profile.noticePeriod,
      summary: profile.summary,
      skills: profile.skills,
      completionPercent: this.calcCompletion(profile),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private calcCompletion(profile: {
    fullName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    headline: string | null;
    currentCompany: string | null;
    experienceYears: number | null;
    location: string | null;
    noticePeriod: string | null;
    summary: string | null;
    skills: string[];
  }) {
    const checks = [
      !!profile.fullName?.trim(),
      !!profile.avatarUrl,
      !!profile.phone?.trim(),
      !!profile.headline?.trim(),
      !!profile.currentCompany?.trim(),
      profile.experienceYears !== null && profile.experienceYears !== undefined,
      !!profile.location?.trim(),
      !!profile.noticePeriod?.trim(),
      !!profile.summary?.trim(),
      profile.skills.length > 0,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }
}
