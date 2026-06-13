import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { normalizeEmail } from '../common/utils/normalize-email';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const OTP_TTL_SECONDS = 10 * 60;
const RESET_OTP_TTL_SECONDS = 15 * 60;
const OTP_REDIS_PREFIX = 'register-otp:';
const RESET_OTP_PREFIX = 'reset-otp:';
const OTP_SEND_RATE_PREFIX = 'otp-send-rate:';
const OTP_VERIFY_RATE_PREFIX = 'otp-verify-rate:';
const RESET_SEND_RATE_PREFIX = 'reset-send-rate:';
const MAX_OTP_SENDS_PER_HOUR = 5;
const MAX_OTP_VERIFY_ATTEMPTS = 5;
const RATE_WINDOW_SECONDS = 60 * 60;
const VERIFY_RATE_WINDOW_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client | null = null;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  async sendRegistrationOtp(dto: SendOtpDto) {
    const email = normalizeEmail(dto.email);
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      this.throwExistingAccountConflict(existing);
    }

    await this.checkRateLimit(
      `${OTP_SEND_RATE_PREFIX}${email}`,
      MAX_OTP_SENDS_PER_HOUR,
      RATE_WINDOW_SECONDS,
    );

    const otp = String(randomInt(100000, 1000000));
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const otpKey = `${OTP_REDIS_PREFIX}${email}`;

    await this.redisService.set(
      otpKey,
      JSON.stringify({ otp, passwordHash, role: dto.role }),
      OTP_TTL_SECONDS,
    );
    await this.redisService.del(`${OTP_VERIFY_RATE_PREFIX}${email}`);

    try {
      await this.emailService.sendOtpEmail(email, otp);
    } catch (err) {
      await this.redisService.del(otpKey);
      throw err;
    }

    return { success: true, message: 'Verification code sent to your email.' };
  }

  async resendRegistrationOtp(dto: ResendOtpDto) {
    const email = normalizeEmail(dto.email);
    const otpKey = `${OTP_REDIS_PREFIX}${email}`;
    const stored = await this.redisService.get(otpKey);

    if (!stored) {
      throw new BadRequestException(
        'No pending registration found. Please start registration again.',
      );
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      await this.redisService.del(otpKey);
      this.throwExistingAccountConflict(existing);
    }

    await this.checkRateLimit(
      `${OTP_SEND_RATE_PREFIX}${email}`,
      MAX_OTP_SENDS_PER_HOUR,
      RATE_WINDOW_SECONDS,
    );

    const payload = JSON.parse(stored) as {
      otp: string;
      passwordHash: string;
      role: UserRole;
    };
    const otp = String(randomInt(100000, 1000000));

    await this.redisService.set(
      otpKey,
      JSON.stringify({ ...payload, otp }),
      OTP_TTL_SECONDS,
    );
    await this.redisService.del(`${OTP_VERIFY_RATE_PREFIX}${email}`);

    try {
      await this.emailService.sendOtpEmail(email, otp);
    } catch (err) {
      throw err;
    }

    return { success: true, message: 'A new verification code has been sent.' };
  }

  async verifyRegistrationOtp(dto: VerifyOtpDto) {
    const email = normalizeEmail(dto.email);
    const key = `${OTP_REDIS_PREFIX}${email}`;
    const stored = await this.redisService.get(key);

    if (!stored) {
      throw new BadRequestException(
        'Verification code expired or not found. Please request a new one.',
      );
    }

    await this.checkRateLimit(
      `${OTP_VERIFY_RATE_PREFIX}${email}`,
      MAX_OTP_VERIFY_ATTEMPTS,
      VERIFY_RATE_WINDOW_SECONDS,
    );

    const payload = JSON.parse(stored) as {
      otp: string;
      passwordHash: string;
      role: UserRole;
    };

    if (payload.otp !== dto.otp) {
      throw new BadRequestException('Invalid verification code.');
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      await this.redisService.del(key);
      this.throwExistingAccountConflict(existing);
    }

    const user = await this.usersService.create({
      email,
      passwordHash: payload.passwordHash,
      role: payload.role,
      emailVerified: true,
    });

    await this.redisService.del(key);
    await this.redisService.del(`${OTP_VERIFY_RATE_PREFIX}${email}`);

    const withProfile = await this.usersService.findByIdWithProfile(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.toPublic(user, withProfile?.profile),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertEmailVerified(user);

    if (!user.passwordHash) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message:
            'This account was created using Google Sign-In. Please continue with Google or create a password.',
          code: 'GOOGLE_ACCOUNT',
        },
        HttpStatus.UNAUTHORIZED,
      );
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
    const email = normalizeEmail(googleUser.email);

    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      const byEmail = await this.usersService.findByEmail(email);
      if (byEmail) {
        if (byEmail.googleId && byEmail.googleId !== googleUser.googleId) {
          throw new ConflictException(
            'Email already linked to another Google account',
          );
        }
        const linked = await this.usersService.linkGoogleAccount(
          byEmail.id,
          googleUser.googleId,
          { fullName: googleUser.fullName, avatarUrl: googleUser.avatarUrl },
        );
        user = linked!;
      } else {
        user = await this.usersService.createGoogleUser({
          email,
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException({
        message: 'This email is not registered with us.',
        code: 'EMAIL_NOT_REGISTERED',
      });
    }

    if (!user.passwordHash) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'This account uses Google Sign-In. Please sign in with Google or create a password in Settings.',
          code: 'GOOGLE_ACCOUNT',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.checkRateLimit(
      `${RESET_SEND_RATE_PREFIX}${email}`,
      MAX_OTP_SENDS_PER_HOUR,
      RATE_WINDOW_SECONDS,
    );

    const otp = String(randomInt(100000, 1000000));
    await this.redisService.set(
      `${RESET_OTP_PREFIX}${email}`,
      otp,
      RESET_OTP_TTL_SECONDS,
    );

    try {
      await this.emailService.sendPasswordResetEmail(email, otp);
    } catch (err) {
      await this.redisService.del(`${RESET_OTP_PREFIX}${email}`);
      throw err;
    }

    return {
      success: true,
      message: 'A reset code has been sent to your email.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = normalizeEmail(dto.email);

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const key = `${RESET_OTP_PREFIX}${email}`;
    const storedOtp = await this.redisService.get(key);
    if (!storedOtp) {
      throw new BadRequestException(
        'Reset code expired or not found. Please request a new one.',
      );
    }

    await this.checkRateLimit(
      `${OTP_VERIFY_RATE_PREFIX}reset:${email}`,
      MAX_OTP_VERIFY_ATTEMPTS,
      VERIFY_RATE_WINDOW_SECONDS,
    );

    if (storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid reset code.');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Account not found.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.usersService.setPassword(user.id, passwordHash);
    await this.redisService.del(key);

    return { success: true, message: 'Password reset successfully.' };
  }

  async setPassword(userId: string, dto: SetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordHash) {
      throw new ConflictException(
        'Password is already set. Use change password instead.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.usersService.setPassword(userId, passwordHash);

    return { success: true, message: 'Password created successfully.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'No password is set. Use create password instead.',
      );
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.setPassword(userId, passwordHash);

    return { success: true, message: 'Password changed successfully.' };
  }

  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto,
    resumeFile?: Express.Multer.File,
  ) {
    const user = await this.usersService.findByIdWithProfile(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.onboardingCompleted) {
      throw new ConflictException('Onboarding already completed');
    }

    const profileData: Record<string, string | null> = {};

    if (user.role === UserRole.CANDIDATE) {
      if (!dto.fullName?.trim()) {
        throw new BadRequestException('Full name is required');
      }
      if (!dto.phone?.trim()) {
        throw new BadRequestException('Phone number is required');
      }
      if (!dto.location?.trim()) {
        throw new BadRequestException('Location is required');
      }
      profileData.fullName = dto.fullName.trim();
      profileData.phone = dto.phone.trim();
      profileData.location = dto.location.trim();
      if (dto.headline?.trim()) {
        profileData.headline = dto.headline.trim();
      }
    } else {
      if (!dto.companyName?.trim()) {
        throw new BadRequestException('Company name is required');
      }
      if (!dto.designation?.trim()) {
        throw new BadRequestException('Designation is required');
      }
      if (!dto.companyWebsite?.trim()) {
        throw new BadRequestException('Company website is required');
      }
      if (!dto.companySize?.trim()) {
        throw new BadRequestException('Company size is required');
      }
      profileData.currentCompany = dto.companyName.trim();
      profileData.designation = dto.designation.trim();
      profileData.companyWebsite = dto.companyWebsite.trim();
      profileData.companySize = dto.companySize.trim();
      profileData.fullName = dto.fullName?.trim() || dto.designation.trim();
      if (dto.industry?.trim()) {
        profileData.industry = dto.industry.trim();
      }
    }

    if (resumeFile && user.role === UserRole.CANDIDATE) {
      profileData.resumeUrl = await this.saveResume(userId, resumeFile);
      profileData.resumeFileName = resumeFile.originalname
        .replace(/[/\\]/g, '')
        .trim()
        .slice(0, 255) || 'resume.pdf';
    } else if (user.role === UserRole.CANDIDATE && !resumeFile) {
      throw new BadRequestException('Resume upload is required');
    }

    await this.usersService.updateOnboardingProfile(userId, profileData);
    await this.usersService.markOnboardingComplete(userId);

    const updated = await this.usersService.findByIdWithProfile(userId);
    return {
      user: this.usersService.toPublic(updated!, updated!.profile),
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

      const withProfile = await this.usersService.findByIdWithProfile(
        payload.sub,
      );
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

  private throwExistingAccountConflict(existing: User): never {
    if (existing.googleId && !existing.passwordHash) {
      throw new ConflictException({
        message:
          'An account with this email already exists. Please sign in with Google.',
        code: 'GOOGLE_ACCOUNT_EXISTS',
      });
    }

    throw new ConflictException({
      message: 'Account already exists. Please log in instead.',
      code: 'ACCOUNT_EXISTS',
    });
  }

  private assertEmailVerified(user: User) {
    if (!user.emailVerified) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Please verify your email before signing in.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private async checkRateLimit(
    key: string,
    max: number,
    windowSeconds: number,
  ) {
    const count = await this.redisService.incr(key);
    if (count === 1) {
      await this.redisService.expire(key, windowSeconds);
    }
    if (count > max) {
      throw new BadRequestException(
        'Too many attempts. Please try again later.',
      );
    }
  }

  private async saveResume(userId: string, file: Express.Multer.File) {
    const { existsSync, mkdirSync, writeFileSync } = await import('fs');
    const { extname, join } = await import('path');

    const allowed = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException('Resume must be PDF or Word document');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Resume must be 5 MB or smaller');
    }

    const dir = join(process.cwd(), 'uploads', 'resumes');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const ext = extname(file.originalname).toLowerCase() || '.pdf';
    const filename = `${userId}${ext}`;
    writeFileSync(join(dir, filename), file.buffer);

    return `/uploads/resumes/${filename}`;
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
      email: normalizeEmail(payload.email),
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
