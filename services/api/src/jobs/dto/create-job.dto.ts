import { EmploymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ScreeningQuestionDto } from './screening-question.dto';

const WORK_MODES = ['ONSITE', 'REMOTE', 'HYBRID', 'WORK_FROM_HOME'] as const;

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(2)
  companyName!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsString()
  location!: string;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsOptional()
  @IsIn([...WORK_MODES])
  workMode?: (typeof WORK_MODES)[number];

  @IsOptional()
  @IsString()
  salaryRange?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  minExperienceYears?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  maxExperienceYears?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ScreeningQuestionDto)
  screeningQuestions?: ScreeningQuestionDto[];
}
