import { EmploymentType } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

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
}
