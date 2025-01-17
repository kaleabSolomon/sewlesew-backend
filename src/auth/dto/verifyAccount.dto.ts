import {
  IsEmail,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  Max,
  Min,
} from 'class-validator';
import { EitherEmailOrPhone } from 'src/common/validators';

export class VerifyAccountDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @EitherEmailOrPhone({
    message: 'Either email or phone number must be provided',
  })
  isPhoneOrEmail!: string;

  @IsInt()
  @Min(100000)
  @Max(999999)
  verificationCode: number;
}
