import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { AppRole, AuthUser, normalizeRoles } from './roles.enum';

/**
 * Validates inbound bearer tokens.
 *  - Production: RS256 against the OIDC provider's JWKS (Azure AD / Entra ID),
 *    when OIDC_ISSUER is configured.
 *  - Dev/local: HS256 against JWT_SECRET.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly rolesClaim: string;

  constructor(config: ConfigService) {
    const issuer = config.get<string>('OIDC_ISSUER');
    const rolesClaim = config.get<string>('OIDC_ROLES_CLAIM') || 'roles';

    let options: StrategyOptions;
    if (issuer) {
      const jwksUri =
        config.get<string>('OIDC_JWKS_URI') || `${issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
      const audience = config.get<string>('OIDC_AUDIENCE');
      options = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKeyProvider: passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 10,
          jwksUri,
        }),
        issuer,
        audience: audience || undefined,
        algorithms: ['RS256'],
      };
    } else {
      options = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret',
        algorithms: ['HS256'],
      };
    }

    super(options);
    this.rolesClaim = rolesClaim;
  }

  validate(payload: Record<string, unknown>): AuthUser {
    if (!payload.sub) throw new UnauthorizedException('Token missing subject (sub)');
    const rawRoles = payload[this.rolesClaim] ?? payload.roles ?? payload.role;
    const roles: AppRole[] = normalizeRoles(rawRoles);
    const email =
      (payload.email as string) ||
      (payload.preferred_username as string) ||
      (payload.upn as string) ||
      String(payload.sub);
    return {
      userId: String(payload.sub),
      email,
      name: payload.name as string | undefined,
      roles,
    };
  }
}
