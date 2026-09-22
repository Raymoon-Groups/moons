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

  const recruiter2 = await prisma.user.upsert({
    where: { email: 'employer@moons.com' },
    update: {
      emailVerified: true,
      onboardingCompleted: true,
    },
    create: {
      email: 'employer@moons.com',
      passwordHash,
      role: 'RECRUITER',
      emailVerified: true,
      onboardingCompleted: true,
      profile: {
        create: {
          fullName: 'Arjun Mehta',
          designation: 'HR Manager',
          currentCompany: 'Raymoon Services',
          companyWebsite: 'https://raymoon.example.com',
          companySize: '11-50 employees',
          industry: 'IT Services & Consulting',
          companyType: 'Private',
          location: 'Gurugram',
          officeAddress: 'Cyber City, Gurugram',
          summary: 'Hiring Python developers and product designers for our growing team.',
          skills: ['Hiring', 'Talent Acquisition'],
          isHiring: true,
          openToWork: false,
        },
      },
    },
  });

  await prisma.profile.upsert({
    where: { userId: recruiter2.id },
    update: {
      fullName: 'Arjun Mehta',
      designation: 'HR Manager',
      currentCompany: 'Raymoon Services',
      location: 'Gurugram',
      isHiring: true,
    },
    create: {
      userId: recruiter2.id,
      fullName: 'Arjun Mehta',
      designation: 'HR Manager',
      currentCompany: 'Raymoon Services',
      skills: [],
      isHiring: true,
    },
  });

  const candidate2 = await prisma.user.upsert({
    where: { email: 'jobseeker@moons.com' },
    update: {
      emailVerified: true,
      onboardingCompleted: true,
    },
    create: {
      email: 'jobseeker@moons.com',
      passwordHash,
      role: 'CANDIDATE',
      emailVerified: true,
      onboardingCompleted: true,
      profile: {
        create: {
          fullName: 'Sneha Kapoor',
          headline: 'Python Developer',
          currentCompany: 'Freelance',
          location: 'Gurugram',
          phone: '+91 9123456789',
          experienceYears: 2,
          noticePeriod: 'Immediate',
          summary:
            'Backend developer specializing in Python, FastAPI, Docker, and PostgreSQL. Open to full-time roles.',
          skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'AWS'],
          preferredRoles: ['Python Developer', 'Backend Developer'],
          preferredLocations: ['Gurugram', 'Remote'],
          preferredIndustries: ['IT Services & Consulting', 'Startup'],
          openToWork: true,
          educations: [
            {
              degree: 'B.Tech',
              institute: 'DTU Delhi',
              fieldOfStudy: 'Information Technology',
              year: '2022',
            },
          ],
          workExperiences: [
            {
              company: 'Freelance',
              designation: 'Python Developer',
              startDate: '2023-01',
              endDate: null,
              isCurrent: true,
              description: 'Built APIs with FastAPI and deployed on AWS.',
            },
          ],
        },
      },
    },
  });

  await prisma.profile.upsert({
    where: { userId: candidate2.id },
    update: {
      fullName: 'Sneha Kapoor',
      headline: 'Python Developer',
      location: 'Gurugram',
      experienceYears: 2,
      skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'AWS'],
      openToWork: true,
    },
    create: {
      userId: candidate2.id,
      fullName: 'Sneha Kapoor',
      headline: 'Python Developer',
      skills: ['Python', 'FastAPI'],
      openToWork: true,
    },
  });

  const fakeCandidates = [
    {
      email: 'fake.candidate1@moons.com',
      fullName: 'Aisha Khan',
      headline: 'Frontend Engineer',
      currentCompany: 'PixelCraft',
      location: 'Bangalore',
      experienceYears: 3,
      noticePeriod: '15 Days',
      skills: ['React', 'TypeScript', 'CSS', 'Next.js'],
      preferredRoles: ['Frontend Engineer', 'UI Engineer'],
      openToWork: true,
    },
    {
      email: 'fake.candidate2@moons.com',
      fullName: 'Vikram Patel',
      headline: 'Backend Engineer',
      currentCompany: 'DataNest',
      location: 'Hyderabad',
      experienceYears: 4,
      noticePeriod: '1 Month',
      skills: ['Node.js', 'PostgreSQL', 'Redis', 'AWS'],
      preferredRoles: ['Backend Engineer', 'API Developer'],
      openToWork: true,
    },
    {
      email: 'fake.candidate3@moons.com',
      fullName: 'Meera Iyer',
      headline: 'Full Stack Developer',
      currentCompany: 'CloudForge',
      location: 'Chennai',
      experienceYears: 5,
      noticePeriod: '2 Months',
      skills: ['React', 'Node.js', 'GraphQL', 'Docker'],
      preferredRoles: ['Full Stack Developer'],
      openToWork: false,
    },
    {
      email: 'fake.candidate4@moons.com',
      fullName: 'Rohan Desai',
      headline: 'DevOps Engineer',
      currentCompany: 'InfraHub',
      location: 'Pune',
      experienceYears: 6,
      noticePeriod: '1 Month',
      skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
      preferredRoles: ['DevOps Engineer', 'SRE'],
      openToWork: true,
    },
    {
      email: 'fake.candidate5@moons.com',
      fullName: 'Neha Reddy',
      headline: 'Product Designer',
      currentCompany: 'StudioNorth',
      location: 'Mumbai',
      experienceYears: 4,
      noticePeriod: 'Immediate',
      skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
      preferredRoles: ['UI/UX Designer', 'Product Designer'],
      openToWork: true,
    },
    {
      email: 'fake.candidate6@moons.com',
      fullName: 'Karan Malhotra',
      headline: 'Data Analyst',
      currentCompany: 'InsightWorks',
      location: 'Delhi',
      experienceYears: 2,
      noticePeriod: '15 Days',
      skills: ['SQL', 'Python', 'Tableau', 'Excel'],
      preferredRoles: ['Data Analyst', 'Business Analyst'],
      openToWork: true,
    },
    {
      email: 'fake.candidate7@moons.com',
      fullName: 'Ananya Bose',
      headline: 'Mobile Developer',
      currentCompany: 'AppOrbit',
      location: 'Kolkata',
      experienceYears: 3,
      noticePeriod: '1 Month',
      skills: ['React Native', 'TypeScript', 'iOS', 'Android'],
      preferredRoles: ['Mobile Developer', 'React Native Developer'],
      openToWork: false,
    },
    {
      email: 'fake.candidate8@moons.com',
      fullName: 'Siddharth Nair',
      headline: 'QA Automation Engineer',
      currentCompany: 'QualityFirst',
      location: 'Bangalore',
      experienceYears: 5,
      noticePeriod: '2 Months',
      skills: ['Playwright', 'Cypress', 'Jest', 'Selenium'],
      preferredRoles: ['QA Engineer', 'SDET'],
      openToWork: true,
    },
    {
      email: 'fake.candidate9@moons.com',
      fullName: 'Pooja Agarwal',
      headline: 'Product Manager',
      currentCompany: 'LaunchPad',
      location: 'Gurugram',
      experienceYears: 7,
      noticePeriod: '1 Month',
      skills: ['Roadmapping', 'Agile', 'Analytics', 'Stakeholder Management'],
      preferredRoles: ['Product Manager'],
      openToWork: true,
    },
    {
      email: 'fake.candidate10@moons.com',
      fullName: 'Aditya Joshi',
      headline: 'Machine Learning Engineer',
      currentCompany: 'NeuralStack',
      location: 'Remote',
      experienceYears: 4,
      noticePeriod: 'Immediate',
      skills: ['Python', 'PyTorch', 'NLP', 'MLOps'],
      preferredRoles: ['ML Engineer', 'Data Scientist'],
      openToWork: true,
    },
  ] as const;

  const createdFakeCandidates: { id: string; email: string; fullName: string }[] = [];

  for (const fake of fakeCandidates) {
    const user = await prisma.user.upsert({
      where: { email: fake.email },
      update: {
        emailVerified: true,
        onboardingCompleted: true,
      },
      create: {
        email: fake.email,
        passwordHash,
        role: 'CANDIDATE',
        emailVerified: true,
        onboardingCompleted: true,
        profile: {
          create: {
            fullName: fake.fullName,
            headline: fake.headline,
            currentCompany: fake.currentCompany,
            location: fake.location,
            experienceYears: fake.experienceYears,
            noticePeriod: fake.noticePeriod,
            skills: [...fake.skills],
            preferredRoles: [...fake.preferredRoles],
            preferredLocations: [fake.location, 'Remote'],
            preferredIndustries: ['IT Services & Consulting', 'Software Product'],
            openToWork: fake.openToWork,
            summary: `${fake.headline} with ${fake.experienceYears}+ years of experience. Looking for strong product teams.`,
            phone: `+91 9${String(Math.floor(100000000 + Math.random() * 899999999)).slice(0, 9)}`,
            currentCtc: '8 - 12 LPA',
            expectedCtc: '12 - 20 LPA',
            educations: [
              {
                degree: 'B.Tech',
                institute: 'Demo Institute of Technology',
                fieldOfStudy: 'Computer Science',
                year: String(2024 - fake.experienceYears),
              },
            ],
            workExperiences: [
              {
                company: fake.currentCompany,
                designation: fake.headline,
                startDate: `${2024 - Math.min(fake.experienceYears, 3)}-01`,
                endDate: null,
                isCurrent: true,
                description: `Working as ${fake.headline} at ${fake.currentCompany}.`,
              },
            ],
          },
        },
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        fullName: fake.fullName,
        headline: fake.headline,
        currentCompany: fake.currentCompany,
        location: fake.location,
        experienceYears: fake.experienceYears,
        noticePeriod: fake.noticePeriod,
        skills: [...fake.skills],
        preferredRoles: [...fake.preferredRoles],
        openToWork: fake.openToWork,
      },
      create: {
        userId: user.id,
        fullName: fake.fullName,
        headline: fake.headline,
        skills: [...fake.skills],
        openToWork: fake.openToWork,
      },
    });

    createdFakeCandidates.push({
      id: user.id,
      email: fake.email,
      fullName: fake.fullName,
    });
  }

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

  const raymoonJobs = [
    {
      title: 'Python Developer',
      companyName: 'Raymoon Services',
      description:
        'Build backend APIs with Python and FastAPI. Experience with Docker, PostgreSQL, and AWS preferred.',
      location: 'Gurugram',
      employmentType: 'FULL_TIME' as const,
      salaryRange: '0 - 3 LPA',
      minExperienceYears: 0,
      maxExperienceYears: 3,
    },
    {
      title: 'UI/UX Designer',
      companyName: 'Raymoon Services',
      description:
        'Design product interfaces and user flows. Figma and design systems experience required.',
      location: 'Gurugram',
      employmentType: 'FULL_TIME' as const,
    },
  ];

  for (const job of raymoonJobs) {
    const existing = await prisma.job.findFirst({
      where: { title: job.title, recruiterId: recruiter2.id },
    });
    if (!existing) {
      await prisma.job.create({
        data: {
          ...job,
          recruiterId: recruiter2.id,
          status: 'PUBLISHED',
        },
      });
    }
  }

  // Apply fake candidates across TechNova (recruiter) jobs so they appear under Candidates.
  const recruiterJobs = await prisma.job.findMany({
    where: { recruiterId: recruiter.id, status: 'PUBLISHED' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const applicationStatuses = [
    'SUBMITTED',
    'VIEWED',
    'SHORTLISTED',
    'REJECTED',
    'SUBMITTED',
    'VIEWED',
    'SHORTLISTED',
    'SUBMITTED',
    'VIEWED',
    'SHORTLISTED',
  ] as const;

  for (let i = 0; i < createdFakeCandidates.length; i++) {
    const fakeUser = createdFakeCandidates[i];
    const job = recruiterJobs[i % Math.max(recruiterJobs.length, 1)];
    if (!job) continue;

    await prisma.application.upsert({
      where: {
        jobId_candidateId: {
          jobId: job.id,
          candidateId: fakeUser.id,
        },
      },
      update: {
        status: applicationStatuses[i] ?? 'SUBMITTED',
      },
      create: {
        jobId: job.id,
        candidateId: fakeUser.id,
        status: applicationStatuses[i] ?? 'SUBMITTED',
        coverNote: `Hi, I'm interested in this role. — ${fakeUser.fullName}`,
      },
    });
  }

  const accounts = [
    { user: recruiter, label: 'Employer 1' },
    { user: recruiter2, label: 'Employer 2' },
    { user: candidate, label: 'Jobseeker 1' },
    { user: candidate2, label: 'Jobseeker 2' },
  ];

  console.log('Seed complete.');
  console.log('Demo accounts (password: password123):\n');
  for (const { user, label } of accounts) {
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    console.log(`${label}: ${profile?.fullName ?? user.email}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Profile: http://localhost:3000/network/${user.id}\n`);
  }

  console.log(`Fake candidates (${createdFakeCandidates.length}, password: password123):`);
  for (const fake of createdFakeCandidates) {
    console.log(`  ${fake.fullName} <${fake.email}>`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
