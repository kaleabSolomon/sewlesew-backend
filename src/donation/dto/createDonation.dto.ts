import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
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
}
