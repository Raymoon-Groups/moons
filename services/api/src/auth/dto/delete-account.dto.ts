import { Equals, IsOptional, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  /** Typed confirmation — must be exactly DELETE */
  @IsString()
  @Equals('DELETE', { message: 'Type DELETE to confirm account deletion' })
  confirmation!: string;

  /** Required when the account has a password (validated in service) */
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
