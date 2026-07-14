import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ScreeningAnswerDto } from '../../jobs/dto/screening-question.dto';

export class CreateApplicationDto {
  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coverNote?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ScreeningAnswerDto)
  screeningAnswers?: ScreeningAnswerDto[];
}
