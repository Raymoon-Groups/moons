import type {
  CertificationEntry,
  EducationEntry,
  WorkExperienceEntry,
} from '@moons/shared';

export type { CertificationEntry, EducationEntry, WorkExperienceEntry };

export interface JobListing {
  id: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  employmentType: string;
  status: string;
  createdAt: string;
  salaryRange?: string | null;
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
  companyLogoUrl?: string | null;
  recruiterId?: string;
}

export interface JobsPage {
  items: JobListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export interface CompanyListing {
  recruiterId: string;
  companyName: string;
  companyLogoUrl: string | null;
  companySummary: string | null;
  industry: string | null;
  companyType: string | null;
  location: string | null;
  openJobs: number;
}

export interface CompaniesPage {
  items: CompanyListing[];
  total: number;
}

export interface CandidateStats {
  total: number;
  submitted: number;
  viewed: number;
  shortlisted: number;
  rejected: number;
}

export interface RecruiterStats {
  totalJobs: number;
  liveJobs: number;
  totalApplicants: number;
  newApplicants: number;
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
      headline: string | null;
      location: string | null;
      resumeUrl: string | null;
    } | null;
  };
}
