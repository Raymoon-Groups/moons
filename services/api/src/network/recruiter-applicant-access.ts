import { PrismaService } from '../prisma/prisma.service';

/** Candidate user IDs who applied to at least one of this recruiter's jobs. */
export async function applicantIdsForRecruiter(
  prisma: PrismaService,
  recruiterId: string,
): Promise<string[]> {
  const rows = await prisma.application.findMany({
    where: { job: { recruiterId } },
    select: { candidateId: true },
    distinct: ['candidateId'],
  });
  return rows.map((row) => row.candidateId);
}

/** Whether a recruiter may view this candidate (must have applied to their job). */
export async function recruiterCanViewCandidate(
  prisma: PrismaService,
  recruiterId: string,
  candidateUserId: string,
): Promise<boolean> {
  const application = await prisma.application.findFirst({
    where: {
      candidateId: candidateUserId,
      job: { recruiterId },
    },
    select: { id: true },
  });
  return Boolean(application);
}
