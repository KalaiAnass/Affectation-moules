import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService, DevLoginResult } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { DevLoginDto } from './dto/dev-login.dto';
import { Public } from './public.decorator';
import { AuthUser } from './roles.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('token')
  @ApiOperation({ summary: 'Dev-only login: mint a JWT for a seeded user (disabled in production).' })
  devLogin(@Body() dto: DevLoginDto): Promise<DevLoginResult> {
    return this.auth.devLogin(dto.email);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated principal.' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
