export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  RECRUITER = 'RECRUITER',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  REMOTE = 'REMOTE',
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  VIEWED = 'VIEWED',
  SHORTLISTED = 'SHORTLISTED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_VIEWED = 'APPLICATION_VIEWED',
  APPLICATION_SHORTLISTED = 'APPLICATION_SHORTLISTED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  PROFILE_VIEW = 'PROFILE_VIEW',
  NETWORK_SUGGESTION = 'NETWORK_SUGGESTION',
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  CONNECTIONS_ONLY = 'CONNECTIONS_ONLY',
  PRIVATE = 'PRIVATE',
}

export enum WorkMode {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  ONSITE = 'ONSITE',
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  hasPassword?: boolean;
  hasGoogle?: boolean;
  /** Bust browser cache when avatar changes (profile updatedAt ms) */
  avatarVersion?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SendOtpRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface SetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  /** Returned for mobile clients; web uses httpOnly cookie instead */
  refreshToken?: string;
}

export interface EducationEntry {
  degree: string;
  institute: string;
  fieldOfStudy?: string;
  year: string;
}

export interface WorkExperienceEntry {
  company: string;
  designation: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string;
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  year?: string;
}

export interface ProjectEntry {
  title: string;
  description?: string;
  url?: string;
  technologies?: string[];
  year?: string;
}

export interface AchievementEntry {
  title: string;
  description?: string;
  year?: string;
}

export interface NetworkUserCard {
  userId: string;
  fullName: string | null;
  headline: string | null;
  avatarUrl: string | null;
  role: UserRole | string | null;
  currentCompany?: string | null;
  location?: string | null;
  openToWork?: boolean;
  isHiring?: boolean;
  sharedSkills?: string[];
  mutualConnections?: number;
  recommendationReason?: string;
  connectionStatus?: ConnectionStatus | 'NONE' | string;
  connectionId?: string | null;
  connectionDirection?: 'sent' | 'received' | null;
}

export interface NetworkStats {
  connections: number;
  pendingReceived: number;
  pendingSent: number;
}
