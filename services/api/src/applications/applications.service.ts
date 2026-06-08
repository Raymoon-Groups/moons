import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async apply(candidateId: string, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
    if (!job || job.status !== JobStatus.PUBLISHED) {
      throw new NotFoundException('Job not found');
    }

    const existing = await this.prisma.application.findUnique({
      where: {
        jobId_candidateId: { jobId: dto.jobId, candidateId },
      },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    return this.prisma.application.create({
      data: {
        jobId: dto.jobId,
        candidateId,
        coverNote: dto.coverNote,
      },
      include: {
        job: {
          select: { id: true, title: true, companyName: true, location: true },
        },
      },
    });
  }

  async findByCandidate(candidateId: string) {
    return this.prisma.application.findMany({
      where: { candidateId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            location: true,
            employmentType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByJob(jobId: string, recruiterId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('You can only view applicants for your jobs');
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                headline: true,
                location: true,
                phone: true,
                currentCompany: true,
                experienceYears: true,
                skills: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    applicationId: string,
    recruiterId: string,
    status: ApplicationStatus,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Not allowed to update this application');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  }

  async hasApplied(candidateId: string, jobId: string) {
    const application = await this.prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
    });
    return { applied: !!application, applicationId: application?.id ?? null };
  }
}
