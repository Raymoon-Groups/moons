import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@moons.com' },
    update: {},
    create: {
      email: 'recruiter@moons.com',
      passwordHash,
      role: 'RECRUITER',
      emailVerified: true,
      onboardingCompleted: true,
      profile: {
        create: {
          fullName: 'Demo Recruiter',
          headline: 'Talent acquisition',
          location: 'Bangalore',
          skills: ['Hiring', 'HR'],
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'candidate@moons.com' },
    update: {},
    create: {
      email: 'candidate@moons.com',
      passwordHash,
      role: 'CANDIDATE',
      emailVerified: true,
      onboardingCompleted: true,
      profile: {
        create: {
          fullName: 'Demo Candidate',
          headline: 'Software Engineer',
          location: 'Bangalore',
          skills: ['React', 'Node.js', 'TypeScript'],
        },
      },
    },
  });

  const jobs = [
    {
      title: 'Senior Software Engineer',
      companyName: 'TechNova Labs',
      description:
        'Build scalable web applications with React and Node.js. 3+ years experience required. Strong problem-solving skills and team collaboration.',
      location: 'Bangalore',
      employmentType: 'FULL_TIME' as const,
    },
    {
      title: 'Product Manager',
      companyName: 'ScaleUp Media',
      description:
        'Own product roadmap and work with engineering and design teams. Experience with agile methodologies and user research.',
      location: 'Mumbai',
      employmentType: 'FULL_TIME' as const,
    },
    {
      title: 'Data Analyst',
      companyName: 'Insight Analytics',
      description:
        'Analyze business data, build dashboards, and present insights. Proficiency in SQL, Python, and visualization tools required.',
      location: 'Hyderabad',
      employmentType: 'FULL_TIME' as const,
    },
    {
      title: 'UI/UX Designer',
      companyName: 'Creative Studio',
      description:
        'Design user interfaces and prototypes for web and mobile products. Strong Figma skills and design system experience.',
      location: 'Remote',
      employmentType: 'REMOTE' as const,
    },
  ];

  for (const job of jobs) {
    const existing = await prisma.job.findFirst({
      where: { title: job.title, recruiterId: recruiter.id },
    });
    if (!existing) {
      await prisma.job.create({
        data: {
          ...job,
          recruiterId: recruiter.id,
          status: 'PUBLISHED',
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log('Demo accounts (password: password123):');
  console.log('  recruiter@moons.com');
  console.log('  candidate@moons.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
