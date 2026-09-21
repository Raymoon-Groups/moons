import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  /** Optional note shown to the candidate when status is REJECTED. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
