import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class UpdateAdminDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'Firstname can only contain letters, spaces, hyphens, and apostrophes',
  })
  firstName: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'Firstname can only contain letters, spaces, hyphens, and apostrophes',
  })
  lastName: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth: string;
}
