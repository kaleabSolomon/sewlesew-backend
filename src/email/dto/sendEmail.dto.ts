import { Address } from 'nodemailer/lib/mailer';

export class SendEmailDto {
  from: Address;
  recipient: string;
  subject: string;
  html: string;
  text?: string;
}
