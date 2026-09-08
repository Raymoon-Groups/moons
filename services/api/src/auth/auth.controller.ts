import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { THROTTLE } from '../common/throttle.constants';
import { AuthService } from './auth.service';
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from './auth-cookies';
import { ensureCsrfCookie } from '../common/middleware/csrf-cookie.middleware';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { parseResume } from './resume-parser.util';

@ApiTags('auth')
@Controller('auth')
@Throttle(THROTTLE.auth)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('admin/me')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  adminMe(@CurrentUser() user: JwtPayload) {
    return { ok: true, email: user.email };
  }

  /** Issue / refresh the readable CSRF cookie for web cookie-auth sessions. */
  @Get('csrf')
  csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = ensureCsrfCookie(req, res);
    return { csrfToken: token };
  }

  @Post('register/send-otp')
  @Throttle(THROTTLE.authStrict)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendRegistrationOtp(dto);
  }

  @Post('register/resend-otp')
  @Throttle(THROTTLE.authStrict)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendRegistrationOtp(dto);
  }

  @Post('register/verify-otp')
  @Throttle(THROTTLE.authStrict)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyRegistrationOtp(dto);
    setAuthCookies(res, result);
    // Tokens remain in JSON for mobile Bearer clients; web uses HttpOnly cookies.
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('google')
  @Throttle(THROTTLE.authStrict)
  async google(
    @Body() dto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginWithGoogle(dto);
    setAuthCookies(res, result);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('login')
  @Throttle(THROTTLE.authStrict)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setAuthCookies(res, result);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('forgot-password')
  @Throttle(THROTTLE.authStrict)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle(THROTTLE.authStrict)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.setPassword(user.sub, dto);
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }
    return result;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(user.sub, dto);
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }
    return result;
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAll(user.sub);
    clearAuthCookies(res);
    return result;
  }

  @Delete('account')
  @Throttle(THROTTLE.authStrict)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.deleteAccount(user.sub, dto);
    clearAuthCookies(res);
    return result;
  }

  @Post('onboarding/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
        companyName: { type: 'string' },
        designation: { type: 'string' },
        companyWebsite: { type: 'string' },
        companySize: { type: 'string' },
        headline: { type: 'string' },
        industry: { type: 'string' },
        resume: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async completeOnboarding(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CompleteOnboardingDto,
    @UploadedFile() resume?: Express.Multer.File,
  ) {
    return this.authService.completeOnboarding(user.sub, dto, resume);
  }

  @Post('refresh')
  @Throttle(THROTTLE.auth)
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] ?? dto.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const result = await this.authService.refresh(refreshToken);
    setAuthCookies(res, result);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('resume/parse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { resume: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async parseResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No resume file uploaded');
    }
    return parseResume(file.buffer, file.mimetype);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] ?? dto.refreshToken;
    await this.authService.logout(refreshToken);
    clearAuthCookies(res);
    return { success: true };
  }
}
