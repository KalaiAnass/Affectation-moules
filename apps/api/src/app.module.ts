import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
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
    AuthModule,
    PressesModule,
    MoldsModule,
    CompatibilityModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    // Guard order: rate-limit -> authenticate -> authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
