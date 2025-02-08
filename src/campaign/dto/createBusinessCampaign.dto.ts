import { BusinessSector, Category } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateCampaignBaseDto } from './createCampaignBase.dto';

export class CreateBusinessCampaignDto extends CreateCampaignBaseDto {
  @IsString()
  @IsOptional()
  website?: string;

  @IsEnum(BusinessSector, {
    message: 'Please Select one of the listed business sectors',
  })
  sector: BusinessSector;

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
