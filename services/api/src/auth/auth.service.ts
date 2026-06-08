import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client | null = null;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
    });

    const withProfile = await this.usersService.findByIdWithProfile(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.toPublic(user, withProfile?.profile),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in with Google');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const withProfile = await this.usersService.findByIdWithProfile(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.toPublic(user, withProfile?.profile),
      ...tokens,
    };
  }

  async loginWithGoogle(dto: GoogleAuthDto) {
    const googleUser = await this.verifyGoogleToken(dto.idToken);
    const role = dto.role ?? UserRole.CANDIDATE;

    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      const byEmail = await this.usersService.findByEmail(googleUser.email);
      if (byEmail) {
        if (byEmail.googleId && byEmail.googleId !== googleUser.googleId) {
          throw new ConflictException('Email already linked to another Google account');
        }
        const linked = await this.usersService.linkGoogleAccount(
          byEmail.id,
          googleUser.googleId,
          { fullName: googleUser.fullName, avatarUrl: googleUser.avatarUrl },
        );
        user = linked!;
      } else {
        user = await this.usersService.createGoogleUser({
          email: googleUser.email,
          googleId: googleUser.googleId,
          role,
          fullName: googleUser.fullName,
          avatarUrl: googleUser.avatarUrl,
        });
      }
    }

    const withProfile = await this.usersService.findByIdWithProfile(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.toPublic(user, withProfile?.profile),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const stored = await this.redisService.get(
        `refresh:${payload.sub}:${payload.jti}`,
      );
      if (!stored || stored !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const withProfile = await this.usersService.findByIdWithProfile(payload.sub);
      if (!withProfile) {
        throw new UnauthorizedException('User not found');
      }

      await this.redisService.del(`refresh:${payload.sub}:${payload.jti}`);
      const tokens = await this.issueTokens(
        withProfile.id,
        withProfile.email,
        withProfile.role,
      );
      return {
        user: this.usersService.toPublic(withProfile, withProfile.profile),
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return { success: true };

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      await this.redisService.del(`refresh:${payload.sub}:${payload.jti}`);
    } catch {
      // ignore invalid token on logout
    }

    return { success: true };
  }

  private getGoogleClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException('Google sign-in is not configured');
    }
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(clientId);
    }
    return this.googleClient;
  }

  private async verifyGoogleToken(idToken: string) {
    const client = this.getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name ?? null,
      avatarUrl: payload.picture ?? null,
    };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const jti = randomUUID();
    const payload = { sub: userId, email, role };

    const accessExpires = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
    const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwtService.signAsync(
        { ...payload, jti },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: refreshExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      ),
    ]);

    await this.redisService.set(
      `refresh:${userId}:${jti}`,
      refreshToken,
      REFRESH_TTL_SECONDS,
    );

    return { accessToken, refreshToken };
  }
}
