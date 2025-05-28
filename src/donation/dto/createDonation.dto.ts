import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateDonationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  donorFirstName: string;

  @IsString()
  @IsNotEmpty()
  donorLastName: string;

  @IsBoolean()
  @IsNotEmpty()
  isAnonymous: boolean;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class CreateStripeDonationDto {
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  @IsNotEmpty()
  amount: number;

  @IsUUID()
  @IsNotEmpty()
  campaignId: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  donorFirstName: string;

  @IsString()
  @IsNotEmpty()
  donorLastName: string;

  @IsBoolean()
  @IsNotEmpty()
  isAnonymous: boolean;

  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  currency: string;
}
