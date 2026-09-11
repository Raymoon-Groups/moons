import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createReadStream, existsSync, statSync } from 'fs';
import { extname, join, normalize, sep } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaJwtPayload } from './media-auth.guard';

const ALLOWED_CATEGORIES = new Set([
  'announcements',
  'avatars',
  'banners',
  'company-logos',
  'resumes',
  'posts',
  'comment-attachments',
  'message-attachments',
]);

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

@Injectable()
export class FilesService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {}

  async authorizeAndResolve(
    category: string,
    filename: string,
    user: MediaJwtPayload | undefined,
  ) {
    if (!ALLOWED_CATEGORIES.has(category)) {
      throw new NotFoundException('File not found');
    }
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new NotFoundException('File not found');
    }

    const absolute = this.safeJoin(category, filename);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      throw new NotFoundException('File not found');
    }

    await this.assertAccess(category, filename, user);

    const ext = extname(filename).toLowerCase();
    const mimeType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    const { size } = statSync(absolute);
    const isResume = category === 'resumes';
    const inline =
      !isResume && (mimeType.startsWith('image/') || mimeType.startsWith('video/'));

    return {
      absolutePath: absolute,
      size,
      mimeType,
      filename,
      contentDisposition: inline
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
      createStream: (start?: number, end?: number) => {
        if (start == null) return createReadStream(absolute);
        return createReadStream(absolute, { start, end });
      },
    };
  }

  private safeJoin(category: string, filename: string) {
    const target = normalize(join(this.uploadsRoot, category, filename));
    const root = normalize(this.uploadsRoot + sep);
    if (!target.startsWith(root) && target !== normalize(this.uploadsRoot)) {
      throw new NotFoundException('File not found');
    }
    return target;
  }

  private async assertAccess(
    category: string,
    filename: string,
    user: MediaJwtPayload | undefined,
  ) {
    if (category === 'announcements') {
      return;
    }

    if (!user?.sub) {
      throw new ForbiddenException('Sign in to access this file');
    }

    // Profile imagery: any signed-in user
    if (
      category === 'avatars' ||
      category === 'banners' ||
      category === 'company-logos' ||
      category === 'posts' ||
      category === 'comment-attachments'
    ) {
      return;
    }

    if (category === 'resumes') {
      await this.assertResumeAccess(filename, user.sub);
      return;
    }

    if (category === 'message-attachments') {
      await this.assertMessageAttachmentAccess(filename, user.sub);
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  private async assertResumeAccess(filename: string, viewerId: string) {
    const ownerId = filename.replace(/\.[^.]+$/, '');
    if (ownerId === viewerId) return;

    // Recruiter who received an application from this candidate
    const application = await this.prisma.application.findFirst({
      where: {
        candidateId: ownerId,
        job: { recruiterId: viewerId },
      },
      select: { id: true },
    });
    if (application) return;

    // Match network profile visibility: connected (or public) + resume not hidden
    const profile = await this.prisma.profile.findUnique({
      where: { userId: ownerId },
      select: {
        hideResume: true,
        profileVisibility: true,
      },
    });
    if (!profile || profile.hideResume) {
      throw new ForbiddenException('You do not have access to this resume');
    }

    if (profile.profileVisibility === 'PUBLIC') return;

    const connection = await this.prisma.connection.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { fromUserId: viewerId, toUserId: ownerId },
          { fromUserId: ownerId, toUserId: viewerId },
        ],
      },
      select: { id: true },
    });
    if (connection) return;

    throw new ForbiddenException('You do not have access to this resume');
  }

  private async assertMessageAttachmentAccess(filename: string, viewerId: string) {
    const relativeUrl = `/uploads/message-attachments/${filename}`;
    const message = await this.prisma.message.findFirst({
      where: { attachmentUrl: relativeUrl },
      select: {
        conversation: {
          select: { participantAId: true, participantBId: true },
        },
      },
    });
    if (!message) {
      throw new NotFoundException('File not found');
    }
    const { participantAId, participantBId } = message.conversation;
    if (viewerId !== participantAId && viewerId !== participantBId) {
      throw new ForbiddenException('You do not have access to this attachment');
    }
  }
}
