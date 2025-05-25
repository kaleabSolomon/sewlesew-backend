import { IsUUID, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsOptional()
  campaignId?: string;

  @IsUUID()
  @IsOptional()
  testimonialId?: string;

  @IsString()
  @IsNotEmpty()
  commentText: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
