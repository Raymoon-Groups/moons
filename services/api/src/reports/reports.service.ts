import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AbuseReportStatus, AbuseReportTarget } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbuseReportDto } from './dto/create-abuse-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateAbuseReportDto) {
    await this.assertTargetExists(dto.targetType, dto.targetId);

    try {
      const report = await this.prisma.abuseReport.create({
        data: {
          reporterId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          reason: dto.reason?.trim() || null,
          details: dto.details?.trim() || null,
        },
      });
      return {
        success: true,
        id: report.id,
        message: 'Thanks — your report was submitted for review.',
      };
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('You already reported this item');
      }
      throw err;
    }
  }

  async listForAdmin(status?: AbuseReportStatus, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    const items = await this.prisma.abuseReport.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        reason: item.reason,
        details: item.details,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        reporter: {
          id: item.reporter.id,
          email: item.reporter.email,
          fullName: item.reporter.profile?.fullName ?? null,
        },
      })),
    };
  }

  async updateStatus(id: string, status: AbuseReportStatus) {
    const existing = await this.prisma.abuseReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found');
    const updated = await this.prisma.abuseReport.update({
      where: { id },
      data: { status },
    });
    return { success: true, id: updated.id, status: updated.status };
  }

  private async assertTargetExists(type: AbuseReportTarget, id: string) {
    switch (type) {
      case AbuseReportTarget.COMMENT: {
        const row = await this.prisma.postComment.findFirst({
          where: { id, deletedAt: null },
          select: { id: true },
        });
        if (!row) throw new BadRequestException('Comment not found');
        return;
      }
      case AbuseReportTarget.POST: {
        const row = await this.prisma.post.findFirst({
          where: { id, deletedAt: null },
          select: { id: true },
        });
        if (!row) throw new BadRequestException('Post not found');
        return;
      }
      case AbuseReportTarget.USER: {
        const row = await this.prisma.user.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!row) throw new BadRequestException('User not found');
        return;
      }
      case AbuseReportTarget.JOB: {
        const row = await this.prisma.job.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!row) throw new BadRequestException('Job not found');
        return;
      }
      case AbuseReportTarget.MESSAGE: {
        const row = await this.prisma.message.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!row) throw new BadRequestException('Message not found');
        return;
      }
      default:
        throw new BadRequestException('Unsupported report target');
    }
  }
}
