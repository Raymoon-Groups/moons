import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus, Prisma } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ScreeningQuestionType,
  type ScreeningAnswer,
  type ScreeningAnswerDto,
  type ScreeningQuestion,
} from '../jobs/dto/screening-question.dto';
import { CreateApplicationDto } from './dto/create-application.dto';

const applicantProfileSelect = {
  fullName: true,
  avatarUrl: true,
  headline: true,
  designation: true,
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
  updatedAt: true,
} as const;

export type RecruiterCandidatesQuery = {
  q?: string;
  jobId?: string;
  status?: ApplicationStatus;
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  noticePeriod?: string;
};

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

    const questions = this.parseScreeningQuestions(job.screeningQuestions);
    const screeningAnswers = await this.validateScreeningAnswers(
      candidateId,
      questions,
      dto.screeningAnswers,
    );

    const candidate = await this.prisma.user.findUnique({
      where: { id: candidateId },
      include: { profile: { select: { fullName: true } } },
    });

    const application = await this.prisma.application.create({
      data: {
        jobId: dto.jobId,
        candidateId,
        coverNote: dto.coverNote,
        screeningAnswers: screeningAnswers as unknown as Prisma.InputJsonValue,
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
    if (candidate?.email) {
      void this.emailService
        .sendApplicationStatusEmail(
          candidate.email,
          job.title,
          job.companyName,
          ApplicationStatus.SUBMITTED,
        )
        .catch(() => undefined);
    }

    return application;
  }

  private parseScreeningQuestions(raw: Prisma.JsonValue): ScreeningQuestion[] {
    if (!Array.isArray(raw)) return [];
    const result: ScreeningQuestion[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const q = item as Record<string, unknown>;
      if (
        typeof q.id !== 'string' ||
        typeof q.prompt !== 'string' ||
        typeof q.type !== 'string'
      ) {
        continue;
      }
      result.push({
        id: q.id,
        prompt: q.prompt,
        type: q.type as ScreeningQuestion['type'],
        required: Boolean(q.required),
        options: Array.isArray(q.options)
          ? q.options.filter((o): o is string => typeof o === 'string')
          : undefined,
        sortOrder: typeof q.sortOrder === 'number' ? q.sortOrder : result.length,
      });
    }
    return result;
  }

  private async validateScreeningAnswers(
    candidateId: string,
    questions: ScreeningQuestion[],
    answers: ScreeningAnswerDto[] | undefined,
  ): Promise<ScreeningAnswer[]> {
    if (questions.length === 0) {
      return [];
    }

    const answerMap = new Map((answers ?? []).map((a) => [a.questionId, a]));
    const normalized: ScreeningAnswer[] = [];

    for (const question of [...questions].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const answer = answerMap.get(question.id);
      const rawValue = answer?.value?.trim() ?? '';

      if (!rawValue) {
        if (question.required) {
          throw new BadRequestException(
            `Please answer: ${question.prompt}`,
          );
        }
        continue;
      }

      if (question.type === ScreeningQuestionType.YES_NO) {
        const normalizedYesNo = rawValue.toLowerCase();
        if (normalizedYesNo !== 'yes' && normalizedYesNo !== 'no') {
          throw new BadRequestException(
            `Answer for "${question.prompt}" must be Yes or No`,
          );
        }
        normalized.push({ questionId: question.id, value: normalizedYesNo === 'yes' ? 'Yes' : 'No' });
        continue;
      }

      if (question.type === ScreeningQuestionType.SINGLE_CHOICE) {
        const options = question.options ?? [];
        if (!options.includes(rawValue)) {
          throw new BadRequestException(
            `Answer for "${question.prompt}" must be one of the provided options`,
          );
        }
        normalized.push({ questionId: question.id, value: rawValue });
        continue;
      }

      if (question.type === ScreeningQuestionType.RESUME) {
        const profile = await this.prisma.profile.findUnique({
          where: { userId: candidateId },
          select: { resumeUrl: true, resumeFileName: true },
        });
        const resumeUrl = profile?.resumeUrl?.trim() || rawValue;
        if (!resumeUrl) {
          throw new BadRequestException(
            `Please upload your resume for: ${question.prompt}`,
          );
        }
        normalized.push({
          questionId: question.id,
          value: resumeUrl,
          fileName: answer?.fileName ?? profile?.resumeFileName ?? null,
        });
        continue;
      }

      normalized.push({
        questionId: question.id,
        value: rawValue.slice(0, 2000),
      });
    }

    return normalized;
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
            screeningQuestions: true,
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

  async findCandidatesForRecruiter(
    recruiterId: string,
    filters: RecruiterCandidatesQuery = {},
  ) {
    const applications = await this.prisma.application.findMany({
      where: {
        job: { recruiterId },
        ...(filters.jobId ? { jobId: filters.jobId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            location: true,
          },
        },
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

    const seen = new Set<string>();
    const unique = applications.filter((app) => {
      if (seen.has(app.candidateId)) return false;
      seen.add(app.candidateId);
      return true;
    });

    const q = filters.q?.trim().toLowerCase();
    const location = filters.location?.trim().toLowerCase();

    return unique.filter((app) => {
      const profile = app.candidate.profile;
      if (!profile) return false;

      if (location) {
        const loc = profile.location?.toLowerCase() ?? '';
        const pref = profile.preferredLocations.some((l) =>
          l.toLowerCase().includes(location),
        );
        if (!loc.includes(location) && !pref) return false;
      }

      if (filters.experienceMin != null) {
        const years = profile.experienceYears ?? 0;
        if (years < filters.experienceMin) return false;
      }

      if (filters.experienceMax != null) {
        const years = profile.experienceYears ?? 0;
        if (years > filters.experienceMax) return false;
      }

      if (filters.noticePeriod) {
        if (profile.noticePeriod !== filters.noticePeriod) return false;
      }

      if (!q) return true;

      const haystack = [
        profile.fullName,
        profile.headline,
        profile.designation,
        profile.currentCompany,
        profile.summary,
        app.candidate.email,
        profile.location,
        ...(profile.skills ?? []),
        ...(profile.preferredRoles ?? []),
        ...(profile.preferredIndustries ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
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
