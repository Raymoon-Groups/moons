import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ListCompaniesDto } from './dto/list-companies.dto';
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

  async suggestLocations(q: string, limit = 8): Promise<string[]> {
    const query = q?.trim() ?? '';
    if (query.length < 2) return [];

    const jobs = await this.prisma.job.findMany({
      where: {
        status: JobStatus.PUBLISHED,
        location: { contains: query, mode: 'insensitive' },
      },
      select: { location: true },
      take: 80,
    });

    const seen = new Set<string>();
    const results: string[] = [];
    for (const job of jobs) {
      const loc = job.location?.trim();
      if (!loc) continue;
      const key = loc.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(loc);
      if (results.length >= limit) break;
    }
    return results;
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

  private companiesCache: {
    items: Array<{
      recruiterId: string;
      companyName: string;
      openJobs: number;
      companyLogoUrl: string | null;
      industry: string | null;
      companyType: string | null;
      companySize: string | null;
      location: string | null;
      companyWebsite: string | null;
      companySummary: string | null;
      featuredJobs: Array<{ id: string; title: string; location: string }>;
    }>;
    expires: number;
  } | null = null;

  private async getAllCompanies() {
    const now = Date.now();
    if (this.companiesCache && this.companiesCache.expires > now) {
      return this.companiesCache.items;
    }

    const grouped = await this.prisma.job.groupBy({
      by: ['recruiterId'],
      where: { status: JobStatus.PUBLISHED },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const recruiterIds = grouped.map((g) => g.recruiterId);
    const [profiles, latestJobs, openJobs] = await Promise.all([
      this.prisma.profile.findMany({
        where: { userId: { in: recruiterIds } },
        select: {
          userId: true,
          currentCompany: true,
          companyLogoUrl: true,
          industry: true,
          companyType: true,
          companySize: true,
          location: true,
          companyWebsite: true,
          summary: true,
        },
      }),
      this.prisma.job.findMany({
        where: { recruiterId: { in: recruiterIds }, status: JobStatus.PUBLISHED },
        orderBy: { createdAt: 'desc' },
        distinct: ['recruiterId'],
        select: { recruiterId: true, companyName: true },
      }),
      this.prisma.job.findMany({
        where: { recruiterId: { in: recruiterIds }, status: JobStatus.PUBLISHED },
        orderBy: { createdAt: 'desc' },
        select: { id: true, recruiterId: true, title: true, location: true },
      }),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const companyNameMap = new Map(latestJobs.map((j) => [j.recruiterId, j.companyName]));
    const countMap = new Map(grouped.map((g) => [g.recruiterId, g._count.id]));
    const jobsByRecruiter = new Map<string, Array<{ id: string; title: string; location: string }>>();
    for (const job of openJobs) {
      const list = jobsByRecruiter.get(job.recruiterId) ?? [];
      if (list.length < 3) {
        list.push({ id: job.id, title: job.title, location: job.location });
        jobsByRecruiter.set(job.recruiterId, list);
      }
    }

    const items = recruiterIds.map((recruiterId) => {
      const profile = profileMap.get(recruiterId);
      return {
        recruiterId,
        companyName:
          profile?.currentCompany?.trim() ||
          companyNameMap.get(recruiterId) ||
          'Company',
        openJobs: countMap.get(recruiterId) ?? 0,
        companyLogoUrl: profile?.companyLogoUrl ?? null,
        industry: profile?.industry ?? null,
        companyType: profile?.companyType ?? null,
        companySize: profile?.companySize ?? null,
        location: profile?.location ?? null,
        companyWebsite: profile?.companyWebsite ?? null,
        companySummary: profile?.summary?.trim() || null,
        featuredJobs: jobsByRecruiter.get(recruiterId) ?? [],
      };
    });

    this.companiesCache = { items, expires: now + 60_000 };
    return items;
  }

  async findCompanies(query: ListCompaniesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    let items = await this.getAllCompanies();

    const q = query.q?.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.industry?.toLowerCase().includes(q),
      );
    }

    const location = query.location?.trim().toLowerCase();
    if (location) {
      items = items.filter((c) => c.location?.toLowerCase().includes(location));
    }

    if (query.companyType) {
      items = items.filter((c) => c.companyType === query.companyType);
    }

    if (query.industry) {
      items = items.filter((c) => c.industry === query.industry);
    }

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return {
      items: paged,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
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

  async findOwnedByRecruiter(recruiterId: string, jobId: string) {
    await this.getOwnedJob(jobId, recruiterId);
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: jobWithRecruiterInclude,
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return this.toJobResponse(job);
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

    const normalized = this.normalizeExperienceParam(experience);
    if (normalized === '0') {
      return {
        OR: [
          { maxExperienceYears: 0 },
          { maxExperienceYears: 1 },
          { AND: [{ minExperienceYears: 0 }, { maxExperienceYears: null }] },
        ],
      };
    }

    const years = Number.parseInt(normalized, 10);
    if (Number.isFinite(years) && years >= 1 && years <= 30) {
      return {
        AND: [
          {
            OR: [
              { minExperienceYears: { lte: years } },
              { minExperienceYears: null },
            ],
          },
          {
            OR: [
              { maxExperienceYears: { gte: years } },
              { maxExperienceYears: null },
            ],
          },
        ],
      };
    }

    return null;
  }

  private normalizeExperienceParam(experience: string): string {
    switch (experience) {
      case 'fresher':
        return '0';
      case '1-3':
        return '2';
      case '3-6':
        return '5';
      case '6+':
        return '6';
      default:
        return experience;
    }
  }

  private toJobResponse(job: JobWithRecruiter) {
    const profile = job.recruiter.profile;
    const postedByCompanyName = profile?.currentCompany?.trim() || null;
    return {
      id: job.id,
      recruiterId: job.recruiter.id,
      title: job.title,
      companyName: job.companyName,
      postedByCompanyName,
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
