import { IsEmail } from 'class-validator';

export class EmailResendDto {
  @IsEmail()
  email: string;
}
