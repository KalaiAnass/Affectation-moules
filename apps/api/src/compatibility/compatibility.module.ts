import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CompatibilityController } from './compatibility.controller';
import { CompatibilityService } from './compatibility.service';

@Module({
  imports: [AuditModule],
  controllers: [CompatibilityController],
  providers: [CompatibilityService],
})
export class CompatibilityModule {}
