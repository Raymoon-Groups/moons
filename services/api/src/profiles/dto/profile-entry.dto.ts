import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class EducationEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  degree!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  institute!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fieldOfStudy?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  year!: string;
}

export class WorkExperienceEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  company!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  designation!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  startDate!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  endDate?: string | null;

  @ApiProperty()
  @IsBoolean()
  isCurrent!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class CertificationEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  issuer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  year?: string;
}
