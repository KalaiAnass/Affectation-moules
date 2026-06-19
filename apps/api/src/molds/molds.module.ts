import { Module } from '@nestjs/common';
import { MoldsController } from './molds.controller';
import { MoldsService } from './molds.service';

@Module({
  controllers: [MoldsController],
  providers: [MoldsService],
  exports: [MoldsService],
})
export class MoldsModule {}
