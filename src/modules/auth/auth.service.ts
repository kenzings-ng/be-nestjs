import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { BCRYPT_SALT_ROUNDS } from '../../common/security.constants';
import { MailService } from '../mail/mail.service';
import { User } from '../users/schema/user.schema';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './types/jwt-payload.type';

// Values match the "Ns/Nm/Nh/Nd" style accepted by jsonwebtoken/ms.
type ExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}`;

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h
const MAX_SESSIONS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ---------------------------------------------------------------------------
  // Register / login
  // ---------------------------------------------------------------------------

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    // Email verification is disabled for this project (no SMTP configured) —
    // accounts are marked verified immediately and can log in right away.
    const user = await this.usersService.create({
      email: dto.email,
      password: hashed,
      name: dto.name,
      isVerified: true,
    });

    // Best-effort — a mail hiccup should never block registration/login.
    // Account is already marked verified above, so the link is informational
    // only (clicking it just re-confirms an already-verified account).
    try {
      await this.sendVerification(user);
    } catch (err) {
      this.logger.warn(
        `Failed to send verification email to ${user.email}: ${err}`,
      );
    }

    const tokens = await this.issueTokens(user, false);
    return { ...tokens, user: this.publicUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const tokens = await this.issueTokens(user, dto.rememberMe ?? false);
    return { ...tokens, user: this.publicUser(user) };
  }

  // ---------------------------------------------------------------------------
  // Refresh / logout
  // ---------------------------------------------------------------------------

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        { secret: this.config.getOrThrow<string>('jwt.refreshSecret') },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hash = this.sha256(refreshToken);
    const entry = user.refreshTokens.find((t) => t.tokenHash === hash);
    if (!entry) {
      // Token not recognized (already rotated/revoked/logged out).
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: drop the used token, issue a fresh pair.
    user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== hash);
    const tokens = await this.issueTokens(user, false);
    return { ...tokens, user: this.publicUser(user) };
  }

  async logout(refreshToken: string) {
    // Best-effort + idempotent: decode to find the owner, then drop this token.
    let sub: string | undefined;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        { secret: this.config.getOrThrow<string>('jwt.refreshSecret') },
      );
      sub = payload.sub;
    } catch {
      // Token invalid/expired — nothing to revoke, treat as already logged out.
      return { message: 'Logged out successfully' };
    }

    const user = await this.usersService.findById(sub);
    if (user) {
      const hash = this.sha256(refreshToken);
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.tokenHash !== hash,
      );
      await user.save();
    }
    return { message: 'Logged out successfully' };
  }

  // ---------------------------------------------------------------------------
  // Email verification
  // ---------------------------------------------------------------------------

  async verifyEmail(token: string) {
    const hash = this.sha256(token);
    const user = await this.usersService.findByVerificationTokenHash(hash);
    if (
      !user ||
      !user.verificationTokenExpires ||
      user.verificationTokenExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.isVerified) {
      await this.sendVerification(user);
    }
    // Generic response — don't reveal whether the email exists.
    return {
      message:
        'If the account exists and is unverified, an email has been sent.',
    };
  }

  // ---------------------------------------------------------------------------
  // Forgot / reset password
  // ---------------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      const token = this.randomToken();
      user.resetTokenHash = this.sha256(token);
      user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();

      const link = `${this.frontendUrl()}/reset-password?token=${token}`;
      await this.mailService.sendPasswordResetEmail(user.email, link);
    }
    // Always generic — avoid leaking which emails are registered.
    return {
      message:
        'If an account exists for that email, a reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hash = this.sha256(dto.token);
    const user = await this.usersService.findByResetTokenHash(hash);
    if (
      !user ||
      !user.resetTokenExpires ||
      user.resetTokenExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    // Force re-login everywhere after a password change.
    user.refreshTokens = [];
    await user.save();

    return { message: 'Password reset successfully. Please log in.' };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async issueTokens(user: User, rememberMe: boolean) {
    const accessPayload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: (this.config.get<string>('jwt.accessExpiresIn') ??
        '15m') as ExpiresIn,
    });

    const refreshExpiresIn = (
      rememberMe
        ? (this.config.get<string>('jwt.refreshRememberExpiresIn') ?? '30d')
        : (this.config.get<string>('jwt.refreshExpiresIn') ?? '7d')
    ) as ExpiresIn;

    const refreshToken = await this.jwtService.signAsync(
      { sub: String(user._id) },
      {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      },
    );

    // Store the hashed refresh token (one entry per device/session).
    const decoded = this.jwtService.decode<{ exp: number }>(refreshToken);
    user.refreshTokens.push({
      tokenHash: this.sha256(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
    });
    // Prune expired sessions and cap how many devices stay logged in.
    const now = Date.now();
    user.refreshTokens = user.refreshTokens
      .filter((t) => t.expiresAt.getTime() > now)
      .slice(-MAX_SESSIONS);
    await user.save();

    return { accessToken, refreshToken };
  }

  private async sendVerification(user: User) {
    const token = this.randomToken();
    user.verificationTokenHash = this.sha256(token);
    user.verificationTokenExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
    await user.save();

    // Points at the FE, which calls GET /auth/verify?token=... itself and
    // shows a result page — the link should never open a raw API response.
    const link = `${this.frontendUrl()}/verify-email?token=${token}`;
    await this.mailService.sendVerificationEmail(user.email, link);
  }

  private publicUser(user: User) {
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  private randomToken(): string {
    return randomBytes(32).toString('hex');
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private frontendUrl(): string {
    return (
      this.config.get<string>('app.frontendUrl') ?? 'http://localhost:4200'
    );
  }
}
