import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpsertAnnouncementDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

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

  /** Required — landing popups are image-led. */
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  imageUrl!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsInt()
  @Min(3)
  @Max(30)
  durationSec?: number;
}
