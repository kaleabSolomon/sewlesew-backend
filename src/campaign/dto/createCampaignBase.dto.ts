import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  Max,
  MinLength,
  IsDecimal,
  IsDateString,
} from 'class-validator';

export class CreateCampaignBaseDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsOptional()
  publicEmail?: string;

  @IsPhoneNumber()
  @IsOptional()
  publicPhoneNumber?: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  contactPhoneNumber: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  relativeLocation?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @MinLength(50, {
    message: 'A Description should Atleas be 50 characters long',
  })
  @MinLength(600, {
    message: 'A Description should be no more than characters long',
  })
  @IsNotEmpty()
  descripton: string;

  @IsDecimal()
  @Max(1, { message: 'Goal amount less than allowd' })
  @IsNotEmpty()
  goalAmount: number;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;
}
