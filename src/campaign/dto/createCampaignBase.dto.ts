import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BankName } from '@prisma/client';
export class CreateCampaignBaseDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsOptional()
  publicEmail?: string;

  @IsString()
  @IsOptional()
  publicPhoneNumber?: string;

  @IsString()
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
  country: string;

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

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @IsString()
  @IsNotEmpty()
  holderName: string;

  @IsEnum(BankName, { message: 'Please select one of the listed Banks' })
  bankName: BankName;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}
