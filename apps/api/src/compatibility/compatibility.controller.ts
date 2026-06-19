import { Body, Controller, Get, Ip, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AppRole, AuthUser } from '../auth/roles.enum';
import { CompatibilityService } from './compatibility.service';
import { CheckCompatibilityDto } from './dto/check-compatibility.dto';

@ApiTags('compatibility')
@ApiBearerAuth()
@Controller('compatibility')
export class CompatibilityController {
  constructor(private readonly compatibility: CompatibilityService) {}

  @Post('check')
  @Roles(AppRole.TECHNICIAN, AppRole.ENGINEER, AppRole.READ_ONLY)
  @ApiOperation({ summary: 'Check whether a mold can be mounted on a press (audited).' })
  check(@Body() dto: CheckCompatibilityDto, @CurrentUser() user: AuthUser, @Ip() ip: string) {
    return this.compatibility.check(dto.pressId, dto.moldId, user, ip);
  }

  @Get('matrix/:moldId')
  @ApiOperation({ summary: 'Compatibility matrix: one mold against all presses.' })
  matrix(@Param('moldId') moldId: string) {
    return this.compatibility.matrix(moldId);
  }

  @Get('reverse/:pressId')
  @ApiOperation({ summary: 'Reverse search: all molds compatible with a press.' })
  reverse(@Param('pressId') pressId: string) {
    return this.compatibility.reverse(pressId);
  }
}
