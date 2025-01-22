import { BusinessSector } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateCampaignBaseDto } from './createCampaignBase.dto';
import { BusinessCategories } from 'src/common/enums';

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

  @IsEnum(BusinessCategories, {
    message: 'Invalid category. Please select one of the listed categories.',
  })
  @IsNotEmpty()
  category: BusinessCategories;
}
