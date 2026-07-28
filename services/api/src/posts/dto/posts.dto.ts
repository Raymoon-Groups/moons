import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  body?: string;
}

export class UpdatePostDto {
  @IsString()
  @MaxLength(3000)
  body!: string;
}

export class CreateCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  body?: string;
}

export class SharePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  body?: string;
}
