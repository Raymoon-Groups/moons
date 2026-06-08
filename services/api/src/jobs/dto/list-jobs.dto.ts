import { IsOptional, IsString } from 'class-validator';

export class ListJobsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
