import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { CompatibilityModule } from './compatibility/compatibility.module';
import { HealthModule } from './health/health.module';
import { MoldsModule } from './molds/molds.module';
import { PrismaModule } from './prisma/prisma.module';
import { PressesModule } from './presses/presses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 120 requests / minute / IP by default.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    PressesModule,
    MoldsModule,
    CompatibilityModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    // Open tool: no authentication barrier. Only rate-limiting is enforced.
    // The auth/ module (JWT + OIDC + RBAC) is kept in the codebase and can be
    // re-enabled by registering JwtAuthGuard / RolesGuard here if SSO is required.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
