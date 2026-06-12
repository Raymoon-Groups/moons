import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@moons.com' },
    update: {
      emailVerified: true,
      onboardingCompleted: true,
    },
    create: {
      email: 'recruiter@moons.com',
      passwordHash,
      role: 'RECRUITER',
      emailVerified: true,
      onboardingCompleted: true,
      profile: {
        create: {
          fullName: 'Priya Sharma',
          designation: 'Talent Acquisition Lead',
          currentCompany: 'TechNova Labs',
          companyWebsite: 'https://technova.example.com',
          companySize: '51-200 employees',
          industry: 'IT Services & Consulting',
          companyType: 'Startup',
          location: 'Bangalore',
          officeAddress: '42 MG Road, Bangalore 560001',
          summary:
            'TechNova Labs builds SaaS products for global clients. We hire passionate engineers and designers.',
          skills: ['Hiring', 'HR'],
        },
      },
    },
  });

  await prisma.profile.upsert({
    where: { userId: recruiter.id },
    update: {
      fullName: 'Priya Sharma',
      designation: 'Talent Acquisition Lead',
      currentCompany: 'TechNova Labs',
      companyWebsite: 'https://technova.example.com',
      companySize: '51-200 employees',
      industry: 'IT Services & Consulting',
      companyType: 'Startup',
      location: 'Bangalore',
      officeAddress: '42 MG Road, Bangalore 560001',
      summary:
        'TechNova Labs builds SaaS products for global clients. We hire passionate engineers and designers.',
    },
    create: {
      userId: recruiter.id,
      fullName: 'Priya Sharma',
      designation: 'Talent Acquisition Lead',
      currentCompany: 'TechNova Labs',
      skills: [],
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@moons.com' },
    update: {
      emailVerified: true,
      onboardingCompleted: true,
    },
    create: {
      email: 'candidate@moons.com',
      passwordHash,
      role: 'CANDIDATE',
      emailVerified: true,
      onboardingCompleted: true,
      profile: {
        create: {
          fullName: 'Rahul Verma',
          headline: 'Senior Software Engineer',
          currentCompany: 'InnoSoft',
          location: 'Bangalore',
          phone: '+91 9876543210',
          experienceYears: 5,
          noticePeriod: '1 Month',
          currentCtc: '10 - 15 LPA',
          expectedCtc: '15 - 25 LPA',
          summary:
            'Full-stack engineer with 5+ years building React and Node.js products. Strong in system design and mentoring.',
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          preferredRoles: ['Senior Software Engineer', 'Full Stack Developer'],
          preferredLocations: ['Bangalore', 'Remote'],
          preferredIndustries: ['IT Services & Consulting', 'Software Product'],
          educations: [
            {
              degree: 'B.Tech',
              institute: 'NIT Karnataka',
              fieldOfStudy: 'Computer Science',
              year: '2019',
            },
          ],
          workExperiences: [
            {
              company: 'InnoSoft',
              designation: 'Senior Software Engineer',
              startDate: '2022-03',
              endDate: null,
              isCurrent: true,
              description: 'Lead frontend architecture and mentor junior developers.',
            },
            {
              company: 'CodeBase',
              designation: 'Software Engineer',
              startDate: '2019-07',
              endDate: '2022-02',
              isCurrent: false,
              description: 'Built REST APIs and React dashboards.',
            },
          ],
          certifications: [
            { name: 'AWS Solutions Architect', issuer: 'Amazon', year: '2023' },
          ],
        },
      },
    },
  });

  await prisma.profile.upsert({
    where: { userId: candidate.id },
    update: {
      fullName: 'Rahul Verma',
      headline: 'Senior Software Engineer',
      currentCompany: 'InnoSoft',
      location: 'Bangalore',
      phone: '+91 9876543210',
      experienceYears: 5,
      noticePeriod: '1 Month',
      currentCtc: '10 - 15 LPA',
      expectedCtc: '15 - 25 LPA',
      summary:
        'Full-stack engineer with 5+ years building React and Node.js products. Strong in system design and mentoring.',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      preferredRoles: ['Senior Software Engineer', 'Full Stack Developer'],
      preferredLocations: ['Bangalore', 'Remote'],
      preferredIndustries: ['IT Services & Consulting', 'Software Product'],
      educations: [
        {
          degree: 'B.Tech',
          institute: 'NIT Karnataka',
          fieldOfStudy: 'Computer Science',
          year: '2019',
        },
      ],
      workExperiences: [
        {
          company: 'InnoSoft',
          designation: 'Senior Software Engineer',
          startDate: '2022-03',
          endDate: null,
          isCurrent: true,
          description: 'Lead frontend architecture and mentor junior developers.',
        },
      ],
      certifications: [
        { name: 'AWS Solutions Architect', issuer: 'Amazon', year: '2023' },
      ],
    },
    create: {
      userId: candidate.id,
      fullName: 'Rahul Verma',
      headline: 'Senior Software Engineer',
      skills: ['React', 'Node.js'],
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
      companyName: 'TechNova Labs',
      description:
        'Own product roadmap and work with engineering and design teams. Experience with agile methodologies and user research.',
      location: 'Mumbai',
      employmentType: 'FULL_TIME' as const,
    },
    {
      title: 'Data Analyst',
      companyName: 'TechNova Labs',
      description:
        'Analyze business data, build dashboards, and present insights. Proficiency in SQL, Python, and visualization tools required.',
      location: 'Hyderabad',
      employmentType: 'FULL_TIME' as const,
    },
    {
      title: 'UI/UX Designer',
      companyName: 'TechNova Labs',
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
