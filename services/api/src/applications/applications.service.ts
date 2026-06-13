import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

const applicantProfileSelect = {
  fullName: true,
  avatarUrl: true,
  headline: true,
  location: true,
  phone: true,
  currentCompany: true,
  experienceYears: true,
  noticePeriod: true,
  summary: true,
  resumeUrl: true,
  resumeFileName: true,
  currentCtc: true,
  expectedCtc: true,
  skills: true,
  educations: true,
  workExperiences: true,
  certifications: true,
  preferredRoles: true,
  preferredLocations: true,
  preferredIndustries: true,
} as const;

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async apply(candidateId: string, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        recruiter: { select: { id: true, email: true } },
      },
    });
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

    const candidate = await this.prisma.user.findUnique({
      where: { id: candidateId },
      include: { profile: { select: { fullName: true } } },
    });

    const application = await this.prisma.application.create({
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

    const candidateName =
      candidate?.profile?.fullName?.trim() || candidate?.email || 'A candidate';
    void this.emailService
      .sendApplicationReceivedEmail(job.recruiter.email, job.title, candidateName)
      .catch(() => undefined);
    void this.notificationsService
      .notifyApplicationReceived(job.recruiter.id, candidateName, job.title, job.id)
      .catch(() => undefined);
    void this.notificationsService
      .notifyApplicationSubmitted(
        candidateId,
        job.title,
        job.companyName,
        job.id,
      )
      .catch(() => undefined);

    return application;
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
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCandidateStats(candidateId: string) {
    const applicationsCount = await this.prisma.application.count({
      where: { candidateId },
    });
    return { applicationsCount };
  }

  async findByJob(jobId: string, recruiterId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('You can only view applicants for your jobs');
    }

    const newlyViewed = await this.prisma.application.findMany({
      where: { jobId, status: ApplicationStatus.SUBMITTED },
      select: { id: true, candidateId: true },
    });

    if (newlyViewed.length > 0) {
      await this.prisma.application.updateMany({
        where: { jobId, status: ApplicationStatus.SUBMITTED },
        data: { status: ApplicationStatus.VIEWED },
      });

      for (const app of newlyViewed) {
        void this.notificationsService
          .notifyApplicationViewed(app.candidateId, job.title, job.companyName)
          .catch(() => undefined);
      }
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            profile: {
              select: applicantProfileSelect,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async withdraw(applicationId: string, candidateId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.candidateId !== candidateId) {
      throw new ForbiddenException('Not allowed to withdraw this application');
    }
    if (
      application.status === ApplicationStatus.SHORTLISTED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      throw new ConflictException('Cannot withdraw after a final decision');
    }

    await this.prisma.application.delete({ where: { id: applicationId } });
    return { success: true, message: 'Application withdrawn' };
  }

  async updateStatus(
    applicationId: string,
    recruiterId: string,
    status: ApplicationStatus,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { select: { email: true } },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Not allowed to update this application');
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    void this.emailService
      .sendApplicationStatusEmail(
        application.candidate.email,
        application.job.title,
        application.job.companyName,
        status,
      )
      .catch(() => undefined);
    void this.notificationsService
      .notifyApplicationStatus(
        application.candidateId,
        application.job.title,
        application.job.companyName,
        status,
      )
      .catch(() => undefined);

    return updated;
  }

  async hasApplied(candidateId: string, jobId: string) {
    const application = await this.prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
    });
    return { applied: !!application, applicationId: application?.id ?? null };
  }
}
