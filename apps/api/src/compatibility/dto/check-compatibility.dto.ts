import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CheckCompatibilityDto {
  @ApiProperty({ example: '2700T2', description: 'Press id (N° de Presse).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  pressId!: string;

  @ApiProperty({ example: '978', description: 'Mold id (N° moule HBT).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  moldId!: string;
}
