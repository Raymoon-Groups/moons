import { EmploymentType, JobStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsString()
  salaryRange?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  minExperienceYears?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  maxExperienceYears?: number | null;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
