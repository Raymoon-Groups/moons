import {
  ConnectionStatus,
  Prisma,
  Profile,
  ProfileVisibility,
  User,
  UserRole,
} from '@prisma/client';

export type ProfileWithUser = Profile & {
  user: Pick<User, 'id' | 'email' | 'role' | 'updatedAt'>;
};

export type EducationJson = {
  degree?: string;
  institute?: string;
  fieldOfStudy?: string;
  year?: string;
};

export type WorkExperienceJson = {
  company?: string;
  designation?: string;
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
};

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function tokenize(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[\s,;/|]+/)
    .map((t) => normalizeToken(t))
    .filter((t) => t.length > 1);
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(normalizeToken).filter(Boolean))];
}

export function intersect(a: string[], b: string[]): string[] {
  const setB = new Set(b.map(normalizeToken));
  return a.filter((item) => setB.has(normalizeToken(item)));
}

export function profileKeywords(profile: ProfileWithUser): string[] {
  const educations = (profile.educations as EducationJson[]) ?? [];
  const work = (profile.workExperiences as WorkExperienceJson[]) ?? [];

  return uniqueStrings([
    ...tokenize(profile.headline),
    ...tokenize(profile.summary),
    ...tokenize(profile.designation),
    ...tokenize(profile.currentCompany),
    ...tokenize(profile.industry),
    ...(profile.skills ?? []),
    ...(profile.preferredRoles ?? []),
    ...(profile.preferredIndustries ?? []),
    ...(profile.careerGoals ?? []),
    ...(profile.professionalInterests ?? []),
    ...educations.flatMap((e) => [
      e.degree ?? '',
      e.institute ?? '',
      e.fieldOfStudy ?? '',
    ]),
    ...work.flatMap((w) => [w.company ?? '', w.designation ?? '']),
  ]);
}

export function educationInstitutes(profile: ProfileWithUser): string[] {
  const educations = (profile.educations as EducationJson[]) ?? [];
  return uniqueStrings(educations.map((e) => e.institute ?? '').filter(Boolean));
}

export function workCompanies(profile: ProfileWithUser): string[] {
  const work = (profile.workExperiences as WorkExperienceJson[]) ?? [];
  return uniqueStrings([
    profile.currentCompany ?? '',
    ...work.map((w) => w.company ?? ''),
  ]);
}

export function publicHeadline(profile: ProfileWithUser): string {
  if (profile.user.role === UserRole.RECRUITER) {
    return profile.designation || profile.headline || profile.currentCompany || 'Recruiter';
  }
  return profile.headline || profile.designation || 'Professional';
}

export function publicDisplayName(profile: ProfileWithUser): string {
  return profile.fullName?.trim() || profile.user.email.split('@')[0];
}

export function connectionWhereEither(userId: string): Prisma.ConnectionWhereInput {
  return {
    OR: [{ fromUserId: userId }, { toUserId: userId }],
  };
}

export function isConnected(
  connections: { fromUserId: string; toUserId: string; status: ConnectionStatus }[],
  userA: string,
  userB: string,
): boolean {
  return connections.some(
    (c) =>
      c.status === ConnectionStatus.ACCEPTED &&
      ((c.fromUserId === userA && c.toUserId === userB) ||
        (c.fromUserId === userB && c.toUserId === userA)),
  );
}

export function canViewProfile(
  profile: ProfileWithUser,
  viewerId: string | null,
  connected: boolean,
): boolean {
  if (!viewerId) {
    return profile.profileVisibility === ProfileVisibility.PUBLIC;
  }
  if (viewerId === profile.userId) return true;
  if (profile.profileVisibility === ProfileVisibility.PRIVATE) return false;
  if (profile.profileVisibility === ProfileVisibility.CONNECTIONS_ONLY) {
    return connected;
  }
  return true;
}
