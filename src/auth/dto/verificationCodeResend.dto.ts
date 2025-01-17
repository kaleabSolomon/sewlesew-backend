import { IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';
import { EitherEmailOrPhone } from 'src/common/validators';

export class VerificationCodeResendDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @EitherEmailOrPhone({
    message: 'Either a phone number or email must be provided',
  })
  emailOrPhone!: string;
}
