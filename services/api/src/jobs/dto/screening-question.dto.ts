import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Kept in API (not imported from @moons/shared) — Nest runs compiled CJS and cannot require shared TS source. */
export enum ScreeningQuestionType {
  TEXT = 'TEXT',
  YES_NO = 'YES_NO',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  RESUME = 'RESUME',
}

export interface ScreeningQuestion {
  id: string;
  prompt: string;
  type: ScreeningQuestionType;
  required: boolean;
  options?: string[];
  sortOrder: number;
}

export interface ScreeningAnswer {
  questionId: string;
  value: string;
  fileName?: string | null;
}

export class ScreeningQuestionDto {
  @IsUUID()
  id!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  prompt!: string;

  @IsEnum(ScreeningQuestionType)
  type!: ScreeningQuestionType;

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  options?: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  sortOrder!: number;
}

export class ScreeningAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  value!: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(255)
  fileName?: string | null;
}

/** Normalize and clamp recruiter-defined screening questions before persist. */
export function normalizeScreeningQuestions(
  questions: ScreeningQuestionDto[] | undefined,
): ScreeningQuestion[] {
  if (!questions?.length) return [];

  const capped = questions.slice(0, 10);
  return capped.map((q, index) => {
    const type = q.type;
    const options =
      type === ScreeningQuestionType.SINGLE_CHOICE
        ? (q.options ?? [])
            .map((o) => o.trim())
            .filter(Boolean)
            .slice(0, 10)
        : undefined;

    return {
      id: q.id,
      prompt: q.prompt.trim(),
      type,
      required: Boolean(q.required),
      options:
        type === ScreeningQuestionType.SINGLE_CHOICE && options && options.length >= 2
          ? options
          : type === ScreeningQuestionType.SINGLE_CHOICE
            ? ['Option 1', 'Option 2']
            : undefined,
      sortOrder: typeof q.sortOrder === 'number' ? q.sortOrder : index,
    };
  });
}
