import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  sanitizeCertifications,
  sanitizeEducations,
  sanitizeWorkExperiences,
} from './profile-entry.utils';

const AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');
const RESUME_DIR = join(process.cwd(), 'uploads', 'resumes');
const COMPANY_LOGO_DIR = join(process.cwd(), 'uploads', 'company-logos');
const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_RESUME_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

type ProfileRecord = {
  id: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  headline: string | null;
  designation: string | null;
  currentCompany: string | null;
  companyWebsite: string | null;
  companySize: string | null;
  companyLogoUrl: string | null;
  industry: string | null;
  companyType: string | null;
  officeAddress: string | null;
  experienceYears: number | null;
  location: string | null;
  noticePeriod: string | null;
  summary: string | null;
  resumeUrl: string | null;
  currentCtc: string | null;
  expectedCtc: string | null;
  educations: Prisma.JsonValue;
  workExperiences: Prisma.JsonValue;
  certifications: Prisma.JsonValue;
  preferredRoles: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
  user: { email: string; role: UserRole };
};

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getPublicCompany(recruiterId: string) {
    const publishedJobs = await this.prisma.job.count({
      where: { recruiterId, status: JobStatus.PUBLISHED },
    });
    if (publishedJobs === 0) {
      throw new NotFoundException('Company not found');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId: recruiterId },
      include: {
        user: { select: { email: true, role: true } },
      },
    });
    if (!profile || profile.user.role !== UserRole.RECRUITER) {
      throw new NotFoundException('Company not found');
    }

    const openJobs = await this.prisma.job.findMany({
      where: { recruiterId, status: JobStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        location: true,
        employmentType: true,
        salaryRange: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      recruiterId,
      companyName: profile.currentCompany,
      companyLogoUrl: profile.companyLogoUrl,
      companyWebsite: profile.companyWebsite,
      industry: profile.industry,
      companyType: profile.companyType,
      companySize: profile.companySize,
      companyLocation: profile.location,
      officeAddress: profile.officeAddress,
      companySummary: profile.summary,
      openJobsCount: publishedJobs,
      openJobs,
    };
  }

  async getCandidateForRecruiter(recruiterId: string, candidateUserId: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        candidateId: candidateUserId,
        job: { recruiterId },
      },
    });
    if (!application) {
      throw new ForbiddenException('You can only view candidates who applied to your jobs');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId: candidateUserId },
      include: {
        user: { select: { email: true, role: true } },
      },
    });
    if (!profile || profile.user.role !== UserRole.CANDIDATE) {
      throw new NotFoundException('Candidate profile not found');
    }

    return this.toProfileResponse(profile);
  }

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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.ProfileUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.location !== undefined) data.location = dto.location.trim() || null;
    if (dto.summary !== undefined) data.summary = dto.summary.trim() || null;

    if (user.role === UserRole.CANDIDATE) {
      if (dto.headline !== undefined) data.headline = dto.headline.trim() || null;
      if (dto.currentCompany !== undefined) {
        data.currentCompany = dto.currentCompany.trim() || null;
      }
      if (dto.experienceYears !== undefined) {
        data.experienceYears = dto.experienceYears;
      }
      if (dto.noticePeriod !== undefined) {
        data.noticePeriod = dto.noticePeriod || null;
      }
      if (dto.skills !== undefined) data.skills = dto.skills;
      if (dto.currentCtc !== undefined) {
        data.currentCtc = dto.currentCtc.trim() || null;
      }
      if (dto.expectedCtc !== undefined) {
        data.expectedCtc = dto.expectedCtc.trim() || null;
      }
      if (dto.preferredRoles !== undefined) {
        this.assertMaxArray(dto.preferredRoles, 15, 'Preferred roles');
        data.preferredRoles = dto.preferredRoles;
      }
      if (dto.preferredLocations !== undefined) {
        this.assertMaxArray(dto.preferredLocations, 15, 'Preferred locations');
        data.preferredLocations = dto.preferredLocations;
      }
      if (dto.preferredIndustries !== undefined) {
        this.assertMaxArray(dto.preferredIndustries, 15, 'Preferred industries');
        data.preferredIndustries = dto.preferredIndustries;
      }
      if (dto.educations !== undefined) {
        const educations = sanitizeEducations(dto.educations);
        this.assertMaxArray(educations, 10, 'Education entries');
        data.educations = educations as unknown as Prisma.InputJsonValue;
      }
      if (dto.workExperiences !== undefined) {
        const workExperiences = sanitizeWorkExperiences(dto.workExperiences);
        this.assertMaxArray(workExperiences, 15, 'Work experience entries');
        data.workExperiences = workExperiences as unknown as Prisma.InputJsonValue;
      }
      if (dto.certifications !== undefined) {
        const certifications = sanitizeCertifications(dto.certifications);
        this.assertMaxArray(certifications, 10, 'Certification entries');
        data.certifications = certifications as unknown as Prisma.InputJsonValue;
      }
    } else {
      if (dto.currentCompany !== undefined) {
        data.currentCompany = dto.currentCompany.trim() || null;
      }
      if (dto.designation !== undefined) {
        data.designation = dto.designation.trim() || null;
      }
      if (dto.companyWebsite !== undefined) {
        data.companyWebsite = dto.companyWebsite.trim() || null;
      }
      if (dto.companySize !== undefined) {
        data.companySize = dto.companySize.trim() || null;
      }
      if (dto.industry !== undefined) {
        data.industry = dto.industry.trim() || null;
      }
      if (dto.companyType !== undefined) {
        data.companyType = dto.companyType.trim() || null;
      }
      if (dto.officeAddress !== undefined) {
        data.officeAddress = dto.officeAddress.trim() || null;
      }
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data,
      include: { user: { select: { email: true, role: true } } },
    });
    return this.toProfileResponse(updated);
  }

  async removeAvatar(userId: string) {
    this.deleteFilesInDir(AVATAR_DIR, userId);
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
    if (!ALLOWED_AVATAR_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, or WEBP images are allowed');
    }
    if (file.buffer.length > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Image must be 2 MB or smaller');
    }

    if (!existsSync(AVATAR_DIR)) {
      mkdirSync(AVATAR_DIR, { recursive: true });
    }

    const ext =
      this.extFromMime(file.mimetype) ??
      (extname(file.originalname).toLowerCase() || '.jpg');
    const filename = `${userId}${ext}`;
    const filepath = join(AVATAR_DIR, filename);

    this.deleteFilesInDir(AVATAR_DIR, userId);
    writeFileSync(filepath, file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
      include: { user: { select: { email: true, role: true } } },
    });

    return this.toProfileResponse(updated);
  }

  async uploadCompanyLogo(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.RECRUITER) {
      throw new BadRequestException('Company logo upload is only for employers');
    }

    if (!ALLOWED_AVATAR_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, or WEBP images are allowed');
    }
    if (file.buffer.length > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Image must be 2 MB or smaller');
    }

    if (!existsSync(COMPANY_LOGO_DIR)) {
      mkdirSync(COMPANY_LOGO_DIR, { recursive: true });
    }

    const ext =
      this.extFromMime(file.mimetype) ??
      (extname(file.originalname).toLowerCase() || '.jpg');
    const filename = `${userId}${ext}`;
    const filepath = join(COMPANY_LOGO_DIR, filename);

    this.deleteFilesInDir(COMPANY_LOGO_DIR, userId);
    writeFileSync(filepath, file.buffer);

    const companyLogoUrl = `/uploads/company-logos/${filename}`;
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { companyLogoUrl },
      include: { user: { select: { email: true, role: true } } },
    });

    return this.toProfileResponse(updated);
  }

  async removeCompanyLogo(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.RECRUITER) {
      throw new BadRequestException('Company logo is only for employers');
    }

    this.deleteFilesInDir(COMPANY_LOGO_DIR, userId);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { companyLogoUrl: null },
      include: { user: { select: { email: true, role: true } } },
    });
    return this.toProfileResponse(updated);
  }

  async uploadResume(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.CANDIDATE) {
      throw new BadRequestException('Resume upload is only for jobseekers');
    }

    if (!ALLOWED_RESUME_MIME.has(file.mimetype)) {
      throw new BadRequestException('Resume must be PDF or Word document');
    }
    if (file.buffer.length > MAX_RESUME_BYTES) {
      throw new BadRequestException('Resume must be 5 MB or smaller');
    }

    if (!existsSync(RESUME_DIR)) {
      mkdirSync(RESUME_DIR, { recursive: true });
    }

    const ext = extname(file.originalname).toLowerCase() || '.pdf';
    const filename = `${userId}${ext}`;
    const filepath = join(RESUME_DIR, filename);

    this.deleteFilesInDir(RESUME_DIR, userId);
    writeFileSync(filepath, file.buffer);

    const resumeUrl = `/uploads/resumes/${filename}`;
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { resumeUrl },
      include: { user: { select: { email: true, role: true } } },
    });

    return this.toProfileResponse(updated);
  }

  async removeResume(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.CANDIDATE) {
      throw new BadRequestException('Resume is only for jobseekers');
    }

    this.deleteFilesInDir(RESUME_DIR, userId);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { resumeUrl: null },
      include: { user: { select: { email: true, role: true } } },
    });
    return this.toProfileResponse(updated);
  }

  private assertMaxArray<T>(items: T[], max: number, label: string) {
    if (items.length > max) {
      throw new BadRequestException(`${label} cannot exceed ${max} entries`);
    }
  }

  private deleteFilesInDir(dir: string, userId: string) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      if (name.startsWith(userId)) {
        unlinkSync(join(dir, name));
      }
    }
  }

  private extFromMime(mime: string) {
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    return null;
  }

  private asArray<T>(value: Prisma.JsonValue): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }

  private toProfileResponse(profile: ProfileRecord) {
    return {
      id: profile.id,
      userId: profile.userId,
      email: profile.user.email,
      role: profile.user.role,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      phone: profile.phone,
      headline: profile.headline,
      designation: profile.designation,
      currentCompany: profile.currentCompany,
      companyWebsite: profile.companyWebsite,
      companySize: profile.companySize,
      companyLogoUrl: profile.companyLogoUrl,
      industry: profile.industry,
      companyType: profile.companyType,
      officeAddress: profile.officeAddress,
      experienceYears: profile.experienceYears,
      location: profile.location,
      noticePeriod: profile.noticePeriod,
      summary: profile.summary,
      resumeUrl: profile.resumeUrl,
      currentCtc: profile.currentCtc,
      expectedCtc: profile.expectedCtc,
      educations: this.asArray(profile.educations),
      workExperiences: this.asArray(profile.workExperiences),
      certifications: this.asArray(profile.certifications),
      preferredRoles: profile.preferredRoles ?? [],
      preferredLocations: profile.preferredLocations ?? [],
      preferredIndustries: profile.preferredIndustries ?? [],
      skills: profile.skills,
      completionPercent: this.calcCompletion(profile, profile.user.role),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private calcCompletion(profile: ProfileRecord, role: UserRole) {
    const checks =
      role === UserRole.RECRUITER
        ? [
            !!profile.fullName?.trim(),
            !!profile.avatarUrl,
            !!profile.companyLogoUrl,
            !!profile.phone?.trim(),
            !!profile.currentCompany?.trim(),
            !!profile.designation?.trim(),
            !!profile.companyWebsite?.trim(),
            !!profile.companySize?.trim(),
            !!profile.industry?.trim(),
            !!profile.companyType?.trim(),
            !!profile.location?.trim(),
            !!profile.officeAddress?.trim(),
            !!profile.summary?.trim(),
          ]
        : [
            !!profile.fullName?.trim(),
            !!profile.avatarUrl,
            !!profile.phone?.trim(),
            !!profile.headline?.trim(),
            !!profile.currentCompany?.trim(),
            profile.experienceYears !== null &&
              profile.experienceYears !== undefined,
            !!profile.location?.trim(),
            !!profile.noticePeriod?.trim(),
            !!profile.currentCtc?.trim(),
            !!profile.expectedCtc?.trim(),
            this.asArray(profile.workExperiences).length > 0,
            this.asArray(profile.educations).length > 0,
            !!profile.summary?.trim(),
            profile.skills.length > 0,
            !!profile.resumeUrl,
            profile.preferredRoles.length > 0,
            this.asArray(profile.certifications).length > 0,
          ];

    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }
}
