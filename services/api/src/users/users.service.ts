import { Injectable } from '@nestjs/common';
import { Profile, User, UserRole } from '@prisma/client';
import { normalizeEmail } from '../common/utils/normalize-email';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdWithProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
    emailVerified?: boolean;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: normalizeEmail(data.email),
        passwordHash: data.passwordHash,
        role: data.role,
        emailVerified: data.emailVerified ?? false,
        profile: { create: {} },
      },
    });
  }

  async createGoogleUser(data: {
    email: string;
    googleId: string;
    role: UserRole;
    fullName?: string | null;
    avatarUrl?: string | null;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: normalizeEmail(data.email),
        googleId: data.googleId,
        role: data.role,
        emailVerified: true,
        profile: {
          create: {
            fullName: data.fullName ?? null,
            avatarUrl: data.avatarUrl ?? null,
          },
        },
      },
    });
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    profile?: { fullName?: string | null; avatarUrl?: string | null },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { googleId, emailVerified: true },
      include: { profile: true },
    });

    if (profile && user.profile) {
      const updates: { fullName?: string; avatarUrl?: string } = {};
      if (!user.profile.fullName && profile.fullName) {
        updates.fullName = profile.fullName;
      }
      if (!user.profile.avatarUrl && profile.avatarUrl) {
        updates.avatarUrl = profile.avatarUrl;
      }
      if (Object.keys(updates).length > 0) {
        await this.prisma.profile.update({
          where: { userId },
          data: updates,
        });
      }
    }

    return this.findByIdWithProfile(userId);
  }

  async setPassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async markOnboardingComplete(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
  }

  async updateOnboardingProfile(
    userId: string,
    data: {
      fullName?: string | null;
      phone?: string | null;
      location?: string | null;
      currentCompany?: string | null;
      designation?: string | null;
      companyWebsite?: string | null;
      companySize?: string | null;
      headline?: string | null;
      industry?: string | null;
      resumeUrl?: string | null;
      resumeFileName?: string | null;
    },
  ) {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  toPublic(user: User, profile?: Profile | null) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: profile?.fullName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      hasPassword: !!user.passwordHash,
      hasGoogle: !!user.googleId,
    };
  }
}
