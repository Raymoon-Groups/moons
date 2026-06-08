export interface Profile {
  id: string;
  userId: string;
  email: string;
  role: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  headline: string | null;
  currentCompany: string | null;
  experienceYears: number | null;
  location: string | null;
  noticePeriod: string | null;
  summary: string | null;
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
      skills: string[];
    } | null;
  };
}
