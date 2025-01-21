import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { userReq } from 'src/common/types';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('AT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user: userReq = {
      userId: payload.sub,
      email: payload.identifier,
      isVerified: payload.isVerified,
      isActive: payload.isActive,
      role: payload.role,
    };

    return user;
  }
}
