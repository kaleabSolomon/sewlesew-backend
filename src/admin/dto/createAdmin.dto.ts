import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { SubAdminRoles } from 'src/common/enums';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'Firstname can only contain letters, spaces, hyphens, and apostrophes',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'Firstname can only contain letters, spaces, hyphens, and apostrophes',
  })
  lastName: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @IsEmail()
  email: string;

  @IsEnum(SubAdminRoles, {
    message: 'You can only create a callcenter agent or campaign reviewer.',
  })
  role: SubAdminRoles;
}
