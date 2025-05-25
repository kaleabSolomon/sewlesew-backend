import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>(
      'TWILIO_ACCOUNT_SID_TEST',
    );
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN_TEST');
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendSMS(to: string, message: string): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get<string>('TWILIO_FROM_NUMBER_TEST_SUCCESS'),
        to,
      });
      console.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send SMS:', error.message);
      throw new Error('Failed to send SMS');
    }
  }
}
