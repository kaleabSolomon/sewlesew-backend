import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/common/validators';

export class ResetPasswordDto {
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @IsString()
  @Match('newPassword', {
    message: 'Password confirmation does not match password',
  })
  passwordConfirm: string;
}
