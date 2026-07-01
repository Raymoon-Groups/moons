import { Injectable } from '@nestjs/common';
import { ConnectionStatus, JobStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from './connections.service';
import {
  educationInstitutes,
  intersect,
  maskOpenToWorkForViewer,
  normalizeToken,
  profileKeywords,
  publicDisplayName,
  publicHeadline,
  ProfileWithUser,
  uniqueStrings,
  workCompanies,
} from './network.utils';

interface ScoredCandidate {
  profile: ProfileWithUser;
  score: number;
  reason: string;
  sharedSkills: string[];
  mutualCount: number;
}

@Injectable()
export class RecommendationsService {
  constructor(
    private prisma: PrismaService,
    private connections: ConnectionsService,
  ) {}

  private buildReason(
    viewer: ProfileWithUser,
    candidate: ProfileWithUser,
    sharedSkills: string[],
    mutualCount: number,
    hiringMatch: boolean,
    alumniMatch: string | null,
    sameIndustry: boolean,
  ): string {
    if (mutualCount > 0) {
      return `You have ${mutualCount} mutual connection${mutualCount === 1 ? '' : 's'}.`;
    }

    if (sharedSkills.length >= 2) {
      return `You both work with ${sharedSkills.slice(0, 4).join(', ')}.`;
    }

    if (sharedSkills.length === 1) {
      return `You both list ${sharedSkills[0]} as a skill.`;
    }

    if (sameIndustry) {
      const industry = candidate.industry || viewer.industry;
      return `You both work in ${industry}.`;
    }

    const sharedIndustries = intersect(
      viewer.preferredIndustries ?? [],
      candidate.preferredIndustries.length
        ? candidate.preferredIndustries
        : candidate.industry
          ? [candidate.industry]
          : [],
    );
    if (sharedIndustries.length > 0) {
      return `You both work in ${sharedIndustries[0]}.`;
    }

    if (alumniMatch) {
      return `You both studied at ${alumniMatch}.`;
    }

    const sharedCompanies = intersect(workCompanies(viewer), workCompanies(candidate));
    if (sharedCompanies.length > 0) {
      return `You both have experience at ${sharedCompanies[0]}.`;
    }

    if (hiringMatch && candidate.user.role === UserRole.RECRUITER) {
      return `This recruiter is hiring for roles that match your skills.`;
    }

    if (viewer.location && candidate.location && viewer.location === candidate.location) {
      return `You're both based in ${viewer.location}.`;
    }

    return 'Suggested based on your profile, skills, and network.';
  }

  private scoreCandidate(
    viewer: ProfileWithUser,
    candidate: ProfileWithUser,
    viewerKeywords: string[],
    candidateKeywords: string[],
    hiringSkillSet: Set<string>,
    mutualCount: number,
  ): ScoredCandidate | null {
    if (viewer.userId === candidate.userId) return null;

    const viewerSkills = uniqueStrings(viewer.skills ?? []);
    const candidateSkills = uniqueStrings(candidate.skills ?? []);
    const sharedSkills = intersect(viewerSkills, candidateSkills);

    let score = 0;

    score += sharedSkills.length * 12;
    score += intersect(viewerKeywords, candidateKeywords).length * 4;
    score += intersect(viewer.preferredRoles ?? [], candidate.preferredRoles ?? []).length * 10;
    score += intersect(
      viewer.preferredLocations ?? [],
      candidate.location ? [candidate.location] : [],
    ).length * 6;
    score += intersect(viewer.preferredIndustries ?? [], candidate.preferredIndustries ?? [])
      .length * 8;
    score += intersect(educationInstitutes(viewer), educationInstitutes(candidate)).length * 14;
    score += intersect(workCompanies(viewer), workCompanies(candidate)).length * 10;
    score += intersect(viewer.careerGoals ?? [], candidate.careerGoals ?? []).length * 7;
    score += intersect(
      viewer.professionalInterests ?? [],
      candidate.professionalInterests ?? [],
    ).length * 5;
    score += mutualCount * 25;

    const viewerIndustry = viewer.industry ? normalizeToken(viewer.industry) : '';
    const candidateIndustry = candidate.industry ? normalizeToken(candidate.industry) : '';
    const sameIndustry =
      !!viewerIndustry && !!candidateIndustry && viewerIndustry === candidateIndustry;
    if (sameIndustry) score += 20;

    if (
      viewer.designation &&
      candidate.designation &&
      normalizeToken(viewer.designation) === normalizeToken(candidate.designation)
    ) {
      score += 14;
    }

    if (viewer.location && candidate.location && viewer.location === candidate.location) {
      score += 8;
    }

    const alumni = intersect(educationInstitutes(viewer), educationInstitutes(candidate))[0] ?? null;

    let hiringMatch = false;
    if (candidate.user.role === UserRole.RECRUITER && candidate.isHiring) {
      const recruiterSkillOverlap = sharedSkills.filter((s) => hiringSkillSet.has(s)).length;
      if (recruiterSkillOverlap > 0 || viewerSkills.some((s) => hiringSkillSet.has(s))) {
        score += 25;
        hiringMatch = true;
      }
    }

    if (candidate.openToWork && viewer.user.role === UserRole.RECRUITER) {
      score += 12;
    }

    if (viewer.user.role === UserRole.CANDIDATE && candidate.user.role === UserRole.CANDIDATE) {
      const expDiff = Math.abs(
        (viewer.experienceYears ?? 0) - (candidate.experienceYears ?? 0),
      );
      if (expDiff <= 2) score += 6;
      if ((candidate.experienceYears ?? 0) >= (viewer.experienceYears ?? 0) + 3) {
        score += 10;
      }
    }

    const profileAgeDays =
      (Date.now() - new Date(candidate.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (profileAgeDays < 30) score += 4;

    if (score < 8) return null;

    return {
      profile: candidate,
      score,
      sharedSkills,
      mutualCount,
      reason: this.buildReason(
        viewer,
        candidate,
        sharedSkills,
        mutualCount,
        hiringMatch,
        alumni,
        sameIndustry,
      ),
    };
  }

  async getSuggestions(userId: string, page = 1, limit = 12) {
    const viewer = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
    });
    if (!viewer) return { items: [], total: 0, page, limit, totalPages: 1 };

    const [allConnections, blocks, candidates, activeJobs] = await Promise.all([
      this.prisma.connection.findMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
          status: { in: [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED] },
        },
        select: { id: true, fromUserId: true, toUserId: true, status: true },
      }),
      this.prisma.userBlock.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
      this.prisma.profile.findMany({
        where: {
          userId: { not: userId },
          user: { onboardingCompleted: true },
        },
        include: { user: { select: { id: true, email: true, role: true, updatedAt: true } } },
        take: 250,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.job.findMany({
        where: { status: JobStatus.PUBLISHED },
        select: { title: true, description: true, recruiterId: true },
        take: 100,
      }),
    ]);

    const excluded = new Set<string>([userId]);
    const pendingByUser = new Map<
      string,
      { connectionId: string; connectionStatus: 'PENDING'; connectionDirection: 'sent' | 'received' }
    >();

    for (const c of allConnections) {
      const otherId = c.fromUserId === userId ? c.toUserId : c.fromUserId;
      if (c.status === ConnectionStatus.ACCEPTED) {
        excluded.add(otherId);
      } else if (c.status === ConnectionStatus.PENDING) {
        pendingByUser.set(otherId, {
          connectionId: c.id,
          connectionStatus: 'PENDING',
          connectionDirection: c.fromUserId === userId ? 'sent' : 'received',
        });
      }
    }
    for (const b of blocks) {
      excluded.add(b.blockerId === userId ? b.blockedId : b.blockerId);
    }

    const viewerKeywords = profileKeywords(viewer);
    const viewerSkills = uniqueStrings(viewer.skills ?? []);
    const hiringSkillSet = new Set<string>();

    for (const job of activeJobs) {
      for (const token of uniqueStrings([
        ...viewerSkills,
        ...job.title.split(/\s+/),
        ...job.description.split(/\s+/).slice(0, 40),
      ])) {
        if (viewerSkills.includes(token)) hiringSkillSet.add(token);
      }
    }

    const myConnections = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      select: { fromUserId: true, toUserId: true },
    });
    const myConnectionSet = new Set(
      myConnections.map((c) => (c.fromUserId === userId ? c.toUserId : c.fromUserId)),
    );

    const eligibleCandidates = candidates.filter((c) => !excluded.has(c.userId));
    const candidateIds = eligibleCandidates.map((c) => c.userId);

    const theirConnectionRows = candidateIds.length
      ? await this.prisma.connection.findMany({
          where: {
            status: ConnectionStatus.ACCEPTED,
            OR: [
              { fromUserId: { in: candidateIds } },
              { toUserId: { in: candidateIds } },
            ],
          },
          select: { fromUserId: true, toUserId: true },
        })
      : [];

    const connectionsByCandidate = new Map<string, Set<string>>();
    for (const row of theirConnectionRows) {
      if (candidateIds.includes(row.fromUserId)) {
        const set = connectionsByCandidate.get(row.fromUserId) ?? new Set<string>();
        set.add(row.toUserId);
        connectionsByCandidate.set(row.fromUserId, set);
      }
      if (candidateIds.includes(row.toUserId)) {
        const set = connectionsByCandidate.get(row.toUserId) ?? new Set<string>();
        set.add(row.fromUserId);
        connectionsByCandidate.set(row.toUserId, set);
      }
    }

    const scored: ScoredCandidate[] = [];

    for (const candidate of eligibleCandidates) {
      const theirSet = connectionsByCandidate.get(candidate.userId) ?? new Set<string>();
      let mutualCount = 0;
      for (const id of theirSet) {
        if (myConnectionSet.has(id)) mutualCount++;
      }

      const result = this.scoreCandidate(
        viewer,
        candidate,
        viewerKeywords,
        profileKeywords(candidate),
        hiringSkillSet,
        mutualCount,
      );
      if (result) scored.push(result);
    }

    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const skip = (page - 1) * limit;
    const slice = scored.slice(skip, skip + limit);

    return {
      items: slice.map((item) => {
        const pending = pendingByUser.get(item.profile.userId);
        return {
          userId: item.profile.userId,
          fullName: publicDisplayName(item.profile),
          headline: publicHeadline(item.profile),
          avatarUrl: item.profile.avatarUrl,
          role: item.profile.user.role,
          currentCompany: item.profile.currentCompany,
          location: item.profile.location,
          openToWork: maskOpenToWorkForViewer(
            item.profile.openToWork,
            viewer.user.role,
            false,
          ),
          isHiring: item.profile.isHiring,
          sharedSkills: item.sharedSkills.slice(0, 8),
          mutualConnections: item.mutualCount,
          recommendationReason: item.reason,
          score: item.score,
          connectionStatus: pending?.connectionStatus ?? 'NONE',
          connectionId: pending?.connectionId ?? null,
          connectionDirection: pending?.connectionDirection ?? null,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
