import { BlogSection } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsEnum(BlogSection)
  section?: BlogSection;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coverImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  readTimeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsEnum(BlogSection)
  section?: BlogSection;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  readTimeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
