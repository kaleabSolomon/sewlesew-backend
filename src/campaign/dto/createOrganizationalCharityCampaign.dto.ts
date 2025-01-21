import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { CharityCategories } from 'src/common/enums';
import { CreateCampaignBaseDto } from './createCampaignBase.dto';

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
  registrationNumber: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsEnum(CharityCategories, {
    message: 'Invalid category. Please select one of the listed categories.',
  })
  @IsNotEmpty()
  category: CharityCategories;
}
