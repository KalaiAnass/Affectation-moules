import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({ example: 'engineer@forvia.local', description: 'Seeded user email (dev only).' })
  @IsEmail()
  email!: string;
}
