import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from 'src/common/validators';

export class changeAdminPasswordDto {
  @IsEmail()
  email: string;

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
