import { Injectable, NotFoundException } from '@nestjs/common';
import type { Mold } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoldsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Mold[]> {
    return this.prisma.mold.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: string): Promise<Mold> {
    const mold = await this.prisma.mold.findUnique({ where: { id } });
    if (!mold) throw new NotFoundException(`Mold "${id}" not found`);
    return mold;
  }
}
