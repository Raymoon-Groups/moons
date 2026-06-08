import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(recruiterId: string, dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        ...dto,
        recruiterId,
        status: JobStatus.PUBLISHED,
      },
    });
  }

  async findPublished(filters: ListJobsDto) {
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

    return this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async findByRecruiter(recruiterId: string) {
    return this.prisma.job.findMany({
      where: { recruiterId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
