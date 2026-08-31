import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertAnnouncementDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  ctaLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ctaUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(30)
  durationSec?: number;
}
