import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EitherEmailOrPhone } from 'src/common/validators';
export class SignInDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @EitherEmailOrPhone({
    message: 'You Must use either Email or Phone number to log in',
  })
  emailOrPhoneNumber!: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  @IsString()
  password: string;
}
