import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConnectionStatus,
  NotificationType,
  Prisma,
  ProfileVisibility,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from './connections.service';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';
import { UpdateNetworkPrivacyDto } from './dto/update-network-privacy.dto';
import {
  canViewProfile,
  intersect,
  publicDisplayName,
  publicHeadline,
  ProfileWithUser,
} from './network.utils';

@Injectable()
export class NetworkProfilesService {
  constructor(
    private prisma: PrismaService,
    private connections: ConnectionsService,
    private notifications: NotificationsService,
  ) {}

  private profileInclude = {
    user: { select: { id: true, email: true, role: true, updatedAt: true } },
  } as const;

  private async getViewerConnectionState(viewerId: string, targetUserId: string) {
    const status = await this.connections.getStatus(viewerId, targetUserId);

    const connected = status.status === ConnectionStatus.ACCEPTED;

    return {
      connected,
      connectionStatus: status.status,
      connectionId: status.connectionId,
      connectionDirection: status.direction,
    };
  }

  private sanitizeProfile(
    profile: ProfileWithUser,
    viewerId: string | null,
    connected: boolean,
  ) {
    const canView = canViewProfile(profile, viewerId, connected);
    const isOwner = viewerId === profile.userId;

    if (!canView && !isOwner) {
      return {
        userId: profile.userId,
        role: profile.user.role,
        fullName: publicDisplayName(profile),
        headline: publicHeadline(profile),
        avatarUrl: profile.avatarUrl,
        bannerUrl: profile.bannerUrl,
        location: profile.location,
        openToWork: profile.openToWork,
        isHiring: profile.isHiring,
        profileVisibility: profile.profileVisibility,
        limited: true,
      };
    }

    return {
      userId: profile.userId,
      role: profile.user.role,
      email: isOwner || !profile.hideEmail ? profile.user.email : null,
      fullName: publicDisplayName(profile),
      headline: publicHeadline(profile),
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      location: profile.location,
      currentCompany: profile.currentCompany,
      designation: profile.designation,
      experienceYears: profile.experienceYears,
      summary: profile.summary,
      skills: profile.skills,
      educations: profile.educations,
      workExperiences: profile.workExperiences,
      certifications: profile.certifications,
      preferredRoles: profile.preferredRoles,
      preferredLocations: profile.preferredLocations,
      preferredIndustries: profile.preferredIndustries,
      careerGoals: profile.careerGoals,
      professionalInterests: profile.professionalInterests,
      projects: profile.projects,
      achievements: profile.achievements,
      githubUrl: profile.githubUrl,
      linkedinUrl: profile.linkedinUrl,
      personalWebsiteUrl: profile.personalWebsiteUrl,
      portfolioUrl: profile.portfolioUrl,
      resumeUrl:
        isOwner || (!profile.hideResume && (connected || profile.profileVisibility === ProfileVisibility.PUBLIC))
          ? profile.resumeUrl
          : null,
      resumeFileName:
        isOwner || (!profile.hideResume && (connected || profile.profileVisibility === ProfileVisibility.PUBLIC))
          ? profile.resumeFileName
          : null,
      phone: isOwner || !profile.hidePhone ? profile.phone : null,
      atsScore: profile.atsScore,
      openToWork: profile.openToWork,
      isHiring: profile.isHiring,
      workMode: profile.workMode,
      industry: profile.industry,
      companyWebsite: profile.companyWebsite,
      companyLogoUrl: profile.companyLogoUrl,
      profileVisibility: profile.profileVisibility,
      hideEmail: profile.hideEmail,
      hidePhone: profile.hidePhone,
      hideResume: profile.hideResume,
      allowProfileVisitors: profile.allowProfileVisitors,
      updatedAt: profile.updatedAt,
      limited: false,
    };
  }

  async recordProfileView(viewerId: string, viewedUserId: string) {
    if (viewerId === viewedUserId) return { recorded: false };

    const profile = await this.prisma.profile.findUnique({
      where: { userId: viewedUserId },
    });
    if (!profile || !profile.allowProfileVisitors) {
      return { recorded: false };
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await this.prisma.profileView.findFirst({
      where: {
        viewerId,
        viewedId: viewedUserId,
        createdAt: { gte: oneDayAgo },
      },
    });
    if (recent) return { recorded: false };

    await this.prisma.profileView.create({
      data: { viewerId, viewedId: viewedUserId },
    });

    const viewerProfile = await this.prisma.profile.findUnique({
      where: { userId: viewerId },
    });
    const viewerName = viewerProfile?.fullName?.trim() || 'Someone';

    await this.notifications.create({
      userId: viewedUserId,
      type: NotificationType.PROFILE_VIEW,
      title: 'Profile view',
      body: `${viewerName} viewed your profile.`,
      linkUrl: `/network/${viewerId}`,
      metadata: { viewerId },
    });

    return { recorded: true };
  }

  async getProfile(viewerId: string | null, targetUserId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: this.profileInclude,
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const block = viewerId
      ? await this.prisma.userBlock.findFirst({
          where: {
            OR: [
              { blockerId: viewerId, blockedId: targetUserId },
              { blockerId: targetUserId, blockedId: viewerId },
            ],
          },
        })
      : null;
    if (block) {
      throw new ForbiddenException('Profile unavailable');
    }

    const connectionState = viewerId
      ? await this.getViewerConnectionState(viewerId, targetUserId)
      : {
          connected: false,
          connectionStatus: 'NONE',
          connectionId: null,
          connectionDirection: null,
        };

    if (viewerId && viewerId !== targetUserId) {
      await this.recordProfileView(viewerId, targetUserId);
    }

    const [connectionCount, mutual, sharedSkills] = await Promise.all([
      this.connections.countConnections(targetUserId),
      viewerId
        ? this.connections.getMutualConnections(viewerId, targetUserId)
        : { count: 0, items: [] },
      viewerId
        ? this.getSharedSkills(viewerId, targetUserId)
        : { items: [] as string[] },
    ]);

    return {
      profile: this.sanitizeProfile(
        profile,
        viewerId,
        connectionState.connected,
      ),
      connectionCount,
      connectionStatus: connectionState.connectionStatus,
      connectionId: connectionState.connectionId,
      connectionDirection: connectionState.connectionDirection,
      mutualConnections: mutual,
      sharedSkills: sharedSkills.items,
      sharedInterests: viewerId
        ? intersect(
            profile.professionalInterests ?? [],
            (
              await this.prisma.profile.findUnique({
                where: { userId: viewerId },
                select: { professionalInterests: true },
              })
            )?.professionalInterests ?? [],
          )
        : [],
    };
  }

  private async getSharedSkills(viewerId: string, targetUserId: string) {
    const [viewer, target] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId: viewerId },
        select: { skills: true },
      }),
      this.prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: { skills: true },
      }),
    ]);
    return { items: intersect(viewer?.skills ?? [], target?.skills ?? []) };
  }

  async searchProfessionals(viewerId: string, dto: SearchProfessionalsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
      select: { blockerId: true, blockedId: true },
    });
    const excluded = new Set<string>([viewerId]);
    for (const b of blocks) {
      excluded.add(b.blockerId === viewerId ? b.blockedId : b.blockerId);
    }

    const where: Prisma.ProfileWhereInput = {
      userId: { notIn: [...excluded] },
      user: { onboardingCompleted: true },
    };

    if (dto.role) where.user = { ...(where.user as object), role: dto.role };
    if (dto.location) where.location = { contains: dto.location, mode: 'insensitive' };
    if (dto.industry) where.industry = { contains: dto.industry, mode: 'insensitive' };
    if (dto.company) {
      where.OR = [
        { currentCompany: { contains: dto.company, mode: 'insensitive' } },
      ];
    }
    if (dto.openToWork !== undefined) where.openToWork = dto.openToWork;
    if (dto.isHiring !== undefined) where.isHiring = dto.isHiring;
    if (dto.workMode) where.workMode = dto.workMode;
    if (dto.experienceMin !== undefined || dto.experienceMax !== undefined) {
      where.experienceYears = {};
      if (dto.experienceMin !== undefined) {
        where.experienceYears.gte = dto.experienceMin;
      }
      if (dto.experienceMax !== undefined) {
        where.experienceYears.lte = dto.experienceMax;
      }
    }
    if (dto.skills) {
      const skills = dto.skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skills.length) where.skills = { hasSome: skills };
    }
    if (dto.q) {
      where.AND = [
        {
          OR: [
            { fullName: { contains: dto.q, mode: 'insensitive' } },
            { headline: { contains: dto.q, mode: 'insensitive' } },
            { currentCompany: { contains: dto.q, mode: 'insensitive' } },
            { summary: { contains: dto.q, mode: 'insensitive' } },
            { skills: { has: dto.q } },
          ],
        },
      ];
    }

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: this.profileInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profile.count({ where }),
    ]);

    const items = await Promise.all(
      profiles.map(async (profile) => {
        const status = await this.connections.getStatus(viewerId, profile.userId);
        const mutual = await this.connections.getMutualConnections(
          viewerId,
          profile.userId,
          3,
        );
        return {
          userId: profile.userId,
          fullName: publicDisplayName(profile),
          headline: publicHeadline(profile),
          avatarUrl: profile.avatarUrl,
          role: profile.user.role,
          currentCompany: profile.currentCompany,
          location: profile.location,
          openToWork: profile.openToWork,
          isHiring: profile.isHiring,
          skills: profile.skills.slice(0, 6),
          connectionStatus: status.status,
          connectionId: status.connectionId,
          mutualConnections: mutual.count,
        };
      }),
    );

    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async listProfileVisitors(userId: string, page = 1, limit = 20) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile?.allowProfileVisitors) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }

    const skip = (page - 1) * limit;
    const where = { viewedId: userId };

    const [views, total] = await Promise.all([
      this.prisma.profileView.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profileView.count({ where }),
    ]);

    const viewerIds = views.map((v) => v.viewerId);
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: viewerIds } },
      include: this.profileInclude,
    });
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return {
      items: views.map((v) => {
        const p = profileMap.get(v.viewerId);
        return {
          viewedAt: v.createdAt,
          viewer: p
            ? {
                userId: p.userId,
                fullName: publicDisplayName(p),
                headline: publicHeadline(p),
                avatarUrl: p.avatarUrl,
                role: p.user.role,
              }
            : { userId: v.viewerId, fullName: null, headline: null, avatarUrl: null, role: null },
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updatePrivacy(userId: string, dto: UpdateNetworkPrivacyDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: {
        profileVisibility: dto.profileVisibility,
        hideEmail: dto.hideEmail,
        hidePhone: dto.hidePhone,
        hideResume: dto.hideResume,
        allowProfileVisitors: dto.allowProfileVisitors,
      },
    });
  }
}
