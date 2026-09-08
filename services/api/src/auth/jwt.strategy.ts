import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { ACCESS_COOKIE } from './auth-cookies';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const token = req?.cookies?.[ACCESS_COOKIE];
          return typeof token === 'string' && token.length > 0 ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ??
        'moons-dev-access-secret-change-in-production',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    ave?: number;
  }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.authService.assertAuthEpoch(payload.sub, payload.ave);
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
