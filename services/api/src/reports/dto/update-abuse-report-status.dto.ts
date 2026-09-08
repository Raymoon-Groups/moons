import { IsEnum, IsOptional } from 'class-validator';
import { AbuseReportStatus } from '@prisma/client';

export class UpdateAbuseReportStatusDto {
  @IsEnum(AbuseReportStatus)
  status!: AbuseReportStatus;

  @IsOptional()
  note?: string;
}
