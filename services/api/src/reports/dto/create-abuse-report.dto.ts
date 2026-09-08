import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AbuseReportTarget } from '@prisma/client';

export class CreateAbuseReportDto {
  @IsEnum(AbuseReportTarget)
  targetType!: AbuseReportTarget;

  @IsUUID()
  targetId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
