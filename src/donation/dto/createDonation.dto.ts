import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateDonationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
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
  isAnonymus: boolean;
}
