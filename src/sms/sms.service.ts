// import { Injectable } from '@nestjs/common';
// import * as Sinch from 'sinch';

// @Injectable()
// export class SmsService {
//   private sinchClient: any;

//   constructor() {
//     // Initialize Sinch client
//     this.sinchClient = new Sinch({
//       key: '3c209cd8-6943-4eb5-9101-d52f1a87ecbf', // Your Sinch API Key
//       secret: 'w~hsAQa9HTMhHyCCEBqmc1O1aN', // Your Sinch API Secret
//     });
//   }

//   // Send SMS method
//   async sendSMS(to: string, message: string): Promise<any> {
//     try {
//       // Use the Sinch API to send the SMS
//       const response = await this.sinchClient.sms.send({
//         from: 'your-sinch-number', // The Sinch number you want to send from
//         to: to, // The recipient's phone number
//         body: message, // The SMS message body
//       });

//       return response;
//     } catch (error) {
//       console.error('Failed to send SMS', error);
//       throw new Error('Failed to send SMS');
//     }
//   }
// }

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
        from: this.configService.get<string>('TWILIO_FROM_NUMBER_TEST_FAILURE'),
        to,
      });
      console.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send SMS:', error.message);
      throw new Error('Failed to send SMS');
    }
  }
}
