import { Injectable, NotFoundException } from '@nestjs/common';
import type { Press } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Press[]> {
    return this.prisma.press.findMany({ orderBy: { clampingForce: 'desc' } });
  }

  async findOne(id: string): Promise<Press> {
    const press = await this.prisma.press.findUnique({ where: { id } });
    if (!press) throw new NotFoundException(`Press "${id}" not found`);
    return press;
  }
}
