import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { AppRole } from '../auth/roles.enum';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@Roles(AppRole.ADMINISTRATOR, AppRole.ENGINEER)
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit history (most recent first). Admin / Engineer only.' })
  async list(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
  ) {
    const [items, total] = await Promise.all([this.audit.list({ skip, take }), this.audit.count()]);
    return { total, skip, take, items };
  }
}
