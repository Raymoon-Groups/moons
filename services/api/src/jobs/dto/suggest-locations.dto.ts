import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestLocationsDto {
  @IsString()
  @MaxLength(80)
  q!: string;

  @IsOptional()
  limit?: string;
}
