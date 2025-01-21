import { IsNotEmpty, IsEnum, IsBoolean } from 'class-validator';
import { PersonalCharityCategoreis } from 'src/common/enums';
import { CreateCampaignBaseDto } from './createCampaignBase.dto';

export class CreatePersonalCharityCampaignDto extends CreateCampaignBaseDto {
  @IsBoolean()
  isOrganization: boolean = false;

  @IsEnum(PersonalCharityCategoreis, {
    message: 'Invalid category. Please select one of the listed categories.',
  })
  @IsNotEmpty()
  category: PersonalCharityCategoreis;
}
