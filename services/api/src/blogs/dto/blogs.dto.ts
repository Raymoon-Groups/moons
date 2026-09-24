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
  @MaxLength(100000)
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
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  externalUrl?: string;

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
  @MaxLength(100000)
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
  @IsString()
  @MaxLength(200)
  metaTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  externalUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  readTimeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
