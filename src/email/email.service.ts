import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { SendEmailDto } from './dto';

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}
  mailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASSWORD'), // Ensure this matches your environment variable name
      },
      debug: true,
      Logger: true,
    });
    return transporter;
  }
  async sendEmail(dto: SendEmailDto) {
    const { from, recipient, html, subject } = dto;

    console.log('email dto: ' + from);
    const transport = this.mailTransport();

    const options: Mail.Options = {
      from: from ?? {
        name: this.config.get<string>('APP_NAME'),
        address: this.config.get<string>('DEFAULT_MAIL_FROM'),
      },
      to: recipient,
      subject,
      html,
    };
    try {
      const result = await transport.sendMail(options);
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Failed to send email', error);
    }
  }
}
