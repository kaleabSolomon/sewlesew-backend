import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { EitherEmailOrPhone } from 'src/common/validators';

export class CreateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @EitherEmailOrPhone({
    message: 'Either phone number or email must be provided',
  })
  eitherEmailOrPhone!: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;
}
