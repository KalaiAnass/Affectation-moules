import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface DevLoginResult {
  accessToken: string;
  user: { id: string; email: string; name: string | null; role: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Whether the dev login endpoint is enabled (must be false in production). */
  devLoginEnabled(): boolean {
    return (
      this.config.get<string>('ALLOW_DEV_LOGIN') === 'true' &&
      this.config.get<string>('NODE_ENV') !== 'production' &&
      !this.config.get<string>('OIDC_ISSUER')
    );
  }

  /**
   * Dev-only: mint a short-lived HS256 token for a seeded user. In production
   * this path is disabled; tokens are issued by Azure AD / Entra ID.
   */
  async devLogin(email: string): Promise<DevLoginResult> {
    if (!this.devLoginEnabled()) {
      throw new UnauthorizedException('Dev login is disabled.');
    }
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      throw new UnauthorizedException('Unknown or inactive user.');
    }
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: [user.role],
    });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
