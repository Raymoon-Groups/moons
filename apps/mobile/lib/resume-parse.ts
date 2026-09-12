import { authUpload } from '@/lib/api';
import { appendUploadFile } from '@/lib/upload-file';

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
  await appendUploadFile(formData, 'resume', {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/pdf',
  });
  return authUpload<ParsedResume>('/auth/resume/parse', formData);
}
