import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PressesService } from './presses.service';

@ApiTags('presses')
@ApiBearerAuth()
@Controller('presses')
export class PressesController {
  constructor(private readonly presses: PressesService) {}

  @Get()
  @ApiOperation({ summary: 'List all presses.' })
  findAll() {
    return this.presses.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one press by id (e.g. 2700T2).' })
  findOne(@Param('id') id: string) {
    return this.presses.findOne(id);
  }
}
