import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@moons/shared';

export type { CertificationEntry, EducationEntry, WorkExperienceEntry };

export interface Profile {
  id: string;
  userId: string;
  email: string;
  role: string;
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
  resumeFileName: string | null;
  currentCtc: string | null;
  expectedCtc: string | null;
  educations: EducationEntry[];
  workExperiences: WorkExperienceEntry[];
  certifications: CertificationEntry[];
  preferredRoles: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  skills: string[];
  bannerUrl?: string | null;
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithJob {
  id: string;
  jobId: string;
  candidateId: string;
  status: string;
  coverNote: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    companyName: string;
    location: string;
    employmentType: string;
  };
}

export interface ApplicantRow {
  id: string;
  status: string;
  coverNote: string | null;
  createdAt: string;
  candidate: {
    id: string;
    email: string;
    profile: {
      fullName: string | null;
      avatarUrl: string | null;
      headline: string | null;
      location: string | null;
      phone: string | null;
      currentCompany: string | null;
      experienceYears: number | null;
      noticePeriod: string | null;
      summary: string | null;
      resumeUrl: string | null;
      resumeFileName: string | null;
      currentCtc: string | null;
      expectedCtc: string | null;
      skills: string[];
      educations: EducationEntry[];
      workExperiences: WorkExperienceEntry[];
      certifications: CertificationEntry[];
      preferredRoles: string[];
      preferredLocations: string[];
      preferredIndustries: string[];
      designation?: string | null;
      updatedAt?: string;
    } | null;
  };
}
