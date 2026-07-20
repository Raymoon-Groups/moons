import { PASSWORD_MIN_LENGTH, PASSWORD_PATTERN, PASSWORD_REQUIREMENTS_MESSAGE } from '@moons/shared';
import { IsString, Matches, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_REQUIREMENTS_MESSAGE })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_REQUIREMENTS_MESSAGE })
  password!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_REQUIREMENTS_MESSAGE })
  confirmPassword!: string;
}
