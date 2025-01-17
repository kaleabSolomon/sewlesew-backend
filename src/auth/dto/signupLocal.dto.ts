import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EitherEmailOrPhone, Match } from 'src/common/validators';

export class SignUpDto {
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
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @EitherEmailOrPhone({
    message: 'Either an email or a phone number must be provided',
  })
  eitherEmailOrPhone!: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @IsString()
  password: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @IsString()
  @Match('password', {
    message: 'Password confirmation does not match password',
  })
  passwordConfirm: string;
}
