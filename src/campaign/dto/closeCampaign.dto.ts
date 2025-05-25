import { IsNotEmpty, IsString } from 'class-validator';

export class CloseCampaignDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
