import { IsNotEmpty, IsString } from 'class-validator';

export class AddCampaignUpdateDto {
  @IsString()
  @IsNotEmpty()
  content: string;
  @IsString()
  @IsNotEmpty()
  title: string;
}
