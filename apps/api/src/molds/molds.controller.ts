import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MoldsService } from './molds.service';

@ApiTags('molds')
@ApiBearerAuth()
@Controller('molds')
export class MoldsController {
  constructor(private readonly molds: MoldsService) {}

  @Get()
  @ApiOperation({ summary: 'List all molds.' })
  findAll() {
    return this.molds.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one mold by id (N° moule HBT, e.g. 978).' })
  findOne(@Param('id') id: string) {
    return this.molds.findOne(id);
  }
}
