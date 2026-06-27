import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileVisibility } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateNetworkPrivacyDto {
  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hideEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hidePhone?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hideResume?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowProfileVisitors?: boolean;
}
