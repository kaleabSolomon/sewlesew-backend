import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
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
  @MaxLength(600, {
    message: 'A Description should be no more 600 than characters long',
  })
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Goal amount must be a valid number' })
  @Min(1.01, { message: 'Goal amount must be more than 1' })
  goalAmount: number;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;
}
