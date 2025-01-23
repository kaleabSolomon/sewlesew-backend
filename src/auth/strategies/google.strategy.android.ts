import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { RoleTypes } from 'src/common/enums';
@Injectable()
export class GoogleStrategyAndroid extends PassportStrategy(
  Strategy,
  'google-android',
) {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('SEWLESEW_MOBILE_CLIENT_ID'),
      //   clientSecret: config.get('OAUTH_GOOGLE_WEB_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3333/api/auth/google/android/redirect',
      scope: ['email', 'profile'],

      passReqToCallback: true,
      session: false, // Disable sessions
    });
  }
  async validate(req: Request, at: string, rt: string, profile: Profile) {
    const user = await this.authService.validateProviderUser(
      profile.emails[0].value,
      profile.name,
      profile.provider,
      profile.id,
      profile.emails[0].verified,
      profile.photos[0].value,
    );

    const tokens = await this.authService.generateTokens(
      user.id,
      user.isVerified,
      user.isActive,
      user.role,
      user.email,
      null,
    );
    await this.authService.updateRtHash(
      user.id,
      tokens.refresh_token,
      RoleTypes.USER,
    );
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }
}
