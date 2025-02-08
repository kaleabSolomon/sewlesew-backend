import { IsNotEmpty, IsEnum, IsBoolean } from 'class-validator';
import { CreateCampaignBaseDto } from './createCampaignBase.dto';
import { Category } from '@prisma/client';

export class CreatePersonalCharityCampaignDto extends CreateCampaignBaseDto {
  @IsBoolean()
  isOrganization: boolean = false;

  @IsEnum(Category, {
    message: 'Invalid category. Please select one of the listed categories.',
  })
  @IsNotEmpty()
  category: Category;
}
