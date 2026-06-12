import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';

const recruiterProfileSelect = {
  companyLogoUrl: true,
  industry: true,
  companyType: true,
  companyWebsite: true,
  companySize: true,
  officeAddress: true,
  summary: true,
  currentCompany: true,
  location: true,
} as const;

const jobWithRecruiterInclude = {
  recruiter: {
    select: {
      id: true,
      profile: {
        select: recruiterProfileSelect,
      },
    },
  },
} as const;

type JobWithRecruiter = Prisma.JobGetPayload<{
  include: typeof jobWithRecruiterInclude;
}>;

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(recruiterId: string, dto: CreateJobDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: recruiterId },
    });

    const companyName =
      dto.companyName?.trim() ||
      profile?.currentCompany?.trim() ||
      'Company';

    const job = await this.prisma.job.create({
      data: {
        title: dto.title,
        companyName,
        description: dto.description,
        location: dto.location?.trim() || profile?.location?.trim() || dto.location,
        employmentType: dto.employmentType,
        salaryRange: dto.salaryRange?.trim() || null,
        minExperienceYears: dto.minExperienceYears ?? null,
        maxExperienceYears: dto.maxExperienceYears ?? null,
        recruiterId,
        status: JobStatus.PUBLISHED,
      },
      include: jobWithRecruiterInclude,
    });

    return this.toJobResponse(job);
  }

  async update(recruiterId: string, jobId: string, dto: UpdateJobDto) {
    const job = await this.getOwnedJob(jobId, recruiterId);

    const data: Prisma.JobUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.companyName !== undefined) data.companyName = dto.companyName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.employmentType !== undefined) data.employmentType = dto.employmentType;
    if (dto.salaryRange !== undefined) {
      data.salaryRange = dto.salaryRange.trim() || null;
    }
    if (dto.minExperienceYears !== undefined) {
      data.minExperienceYears = dto.minExperienceYears;
    }
    if (dto.maxExperienceYears !== undefined) {
      data.maxExperienceYears = dto.maxExperienceYears;
    }
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.job.update({
      where: { id: job.id },
      data,
      include: jobWithRecruiterInclude,
    });

    return this.toJobResponse(updated);
  }

  async close(recruiterId: string, jobId: string) {
    return this.update(recruiterId, jobId, { status: JobStatus.CLOSED });
  }

  async findPublished(filters: ListJobsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      status: JobStatus.PUBLISHED,
    };

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { companyName: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const experienceFilter = this.buildExperienceFilter(filters.experience);
    if (experienceFilter) {
      const existing = where.AND
        ? Array.isArray(where.AND)
          ? where.AND
          : [where.AND]
        : [];
      where.AND = [...existing, experienceFilter];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: jobWithRecruiterInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items: jobs.map((job) => this.toJobResponse(job)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findTrending(limit = 4) {
    const jobs = await this.prisma.job.findMany({
      where: { status: JobStatus.PUBLISHED },
      include: jobWithRecruiterInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return jobs.map((job) => this.toJobResponse(job));
  }

  async findTopCompanies(limit = 8) {
    const grouped = await this.prisma.job.groupBy({
      by: ['recruiterId'],
      where: { status: JobStatus.PUBLISHED },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const recruiterIds = grouped.map((g) => g.recruiterId);
    const [profiles, latestJobs] = await Promise.all([
      this.prisma.profile.findMany({
        where: { userId: { in: recruiterIds } },
        select: {
          userId: true,
          currentCompany: true,
          companyLogoUrl: true,
          industry: true,
          location: true,
        },
      }),
      this.prisma.job.findMany({
        where: { recruiterId: { in: recruiterIds }, status: JobStatus.PUBLISHED },
        orderBy: { createdAt: 'desc' },
        distinct: ['recruiterId'],
        select: { recruiterId: true, companyName: true },
      }),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const companyNameMap = new Map(latestJobs.map((j) => [j.recruiterId, j.companyName]));

    return grouped.map((g) => {
      const profile = profileMap.get(g.recruiterId);
      return {
        recruiterId: g.recruiterId,
        companyName:
          profile?.currentCompany?.trim() ||
          companyNameMap.get(g.recruiterId) ||
          'Company',
        openJobs: g._count.id,
        companyLogoUrl: profile?.companyLogoUrl ?? null,
        industry: profile?.industry ?? null,
        location: profile?.location ?? null,
      };
    });
  }

  async findById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: jobWithRecruiterInclude,
    });
    if (!job || job.status === JobStatus.DRAFT) {
      throw new NotFoundException('Job not found');
    }
    return this.toJobResponse(job);
  }

  async findByRecruiter(recruiterId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { recruiterId },
      include: jobWithRecruiterInclude,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toJobResponse(job));
  }

  async delete(recruiterId: string, jobId: string) {
    await this.getOwnedJob(jobId, recruiterId);
    await this.prisma.job.delete({ where: { id: jobId } });
    return { success: true, message: 'Job deleted successfully' };
  }

  async getRecruiterStats(recruiterId: string) {
    const [jobsCount, activeJobsCount, applicantsCount] = await Promise.all([
      this.prisma.job.count({ where: { recruiterId } }),
      this.prisma.job.count({
        where: { recruiterId, status: JobStatus.PUBLISHED },
      }),
      this.prisma.application.count({
        where: { job: { recruiterId } },
      }),
    ]);

    return { jobsCount, activeJobsCount, applicantsCount };
  }

  private async getOwnedJob(jobId: string, recruiterId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('You can only manage your own jobs');
    }
    return job;
  }

  private buildExperienceFilter(
    experience?: string,
  ): Prisma.JobWhereInput | null {
    if (!experience) return null;

    switch (experience) {
      case 'fresher':
        return {
          OR: [
            { maxExperienceYears: 0 },
            { AND: [{ minExperienceYears: 0 }, { maxExperienceYears: null }] },
          ],
        };
      case '1-3':
        return {
          AND: [
            { OR: [{ minExperienceYears: { lte: 3 } }, { minExperienceYears: null }] },
            { OR: [{ maxExperienceYears: { gte: 1 } }, { maxExperienceYears: null }] },
          ],
        };
      case '3-6':
        return {
          AND: [
            { OR: [{ minExperienceYears: { lte: 6 } }, { minExperienceYears: null }] },
            { OR: [{ maxExperienceYears: { gte: 3 } }, { maxExperienceYears: null }] },
          ],
        };
      case '6+':
        return {
          OR: [
            { minExperienceYears: { gte: 6 } },
            { maxExperienceYears: { gte: 6 } },
          ],
        };
      default:
        return null;
    }
  }

  private toJobResponse(job: JobWithRecruiter) {
    const profile = job.recruiter.profile;
    return {
      id: job.id,
      recruiterId: job.recruiter.id,
      title: job.title,
      companyName: job.companyName,
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      salaryRange: job.salaryRange,
      minExperienceYears: job.minExperienceYears,
      maxExperienceYears: job.maxExperienceYears,
      status: job.status,
      createdAt: job.createdAt,
      companyLogoUrl: profile?.companyLogoUrl ?? null,
      companyWebsite: profile?.companyWebsite ?? null,
      industry: profile?.industry ?? null,
      companyType: profile?.companyType ?? null,
      companySize: profile?.companySize ?? null,
      companyLocation: profile?.location ?? null,
      officeAddress: profile?.officeAddress ?? null,
      companySummary: profile?.summary ?? null,
    };
  }
}
