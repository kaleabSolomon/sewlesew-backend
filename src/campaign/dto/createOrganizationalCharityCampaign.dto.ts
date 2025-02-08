import { IsString, IsNotEmpty, IsEnum, IsBoolean } from 'class-validator';
import { CreateCampaignBaseDto } from './createCampaignBase.dto';
import { Category } from '@prisma/client';

export class CreateOrganizationalCharityCampaignDto extends CreateCampaignBaseDto {
  @IsBoolean()
  isOrganization: boolean = true;

  @IsString()
  @IsNotEmpty()
  website: string;

  @IsString()
  @IsNotEmpty()
  tinNumber: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsEnum(Category, {
    message: 'Invalid category. Please select one of the listed categories.',
  })
  @IsNotEmpty()
  category: Category;
}
