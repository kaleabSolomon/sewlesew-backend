import { IsNotEmpty, IsString, Min } from 'class-validator';

export class AddCampaignUpdateDto {
  @IsString()
  @Min(20, {
    message: 'Update content must be at least 20 characters long',
  })
  @IsNotEmpty()
  content: string;
  @IsString()
  @IsNotEmpty()
  title: string;
}
