import { UserRole } from '@moons/shared';

export const OPEN_ON_MOONS_LABEL = 'Open on Moons';
export const OPEN_ON_MOONS_TAGLINE = 'Moons is open for work';
export const OPEN_ON_MOONS_DESCRIPTION =
  'Let recruiters on Moons know you are exploring opportunities. Only employers see this — not other jobseekers.';

export function showOpenOnMoonsToViewer(
  openToWork: boolean | undefined,
  viewerRole: UserRole | string | null | undefined,
  isOwner: boolean,
): boolean {
  if (!openToWork) return false;
  if (isOwner) return true;
  return viewerRole === UserRole.RECRUITER;
}
