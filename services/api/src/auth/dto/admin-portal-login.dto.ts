import { IsString, MinLength } from 'class-validator';

export class AdminPortalLoginDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
