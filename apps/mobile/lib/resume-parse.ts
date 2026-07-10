import { authUpload } from '@/lib/api';

export interface ParsedResume {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  skills: string[];
  workExperiences: Array<{
    company: string;
    designation: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string;
  }>;
  educations: Array<{
    degree: string;
    institute: string;
    fieldOfStudy: string;
    year: string;
  }>;
}

export async function parseResumeFile(asset: {
  uri: string;
  name: string;
  mimeType?: string | null;
}) {
  const formData = new FormData();
  formData.append('resume', {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? 'application/pdf',
  } as unknown as Blob);
  return authUpload<ParsedResume>('/auth/resume/parse', formData);
}
