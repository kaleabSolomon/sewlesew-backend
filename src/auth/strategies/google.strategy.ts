import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('SEWLESEW_WEB_CLIENT_ID'),
      clientSecret: config.get('SEWLESEW_WEB_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3333/api/auth/google/redirect',
      scope: ['profile', 'email'],
      passReqToCallback: true,
      session: false,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
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

    await this.authService.updateRtHash(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }
}
