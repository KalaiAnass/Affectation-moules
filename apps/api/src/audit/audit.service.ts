import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntryInput {
  action: string;
  userId?: string;
  userEmail?: string;
  pressId?: string;
  moldId?: string;
  decision?: string;
  requiresAdaptation?: boolean;
  detail?: Prisma.InputJsonValue;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Append an audit record. Never throws into the request path. */
  async record(entry: AuditEntryInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: entry });
    } catch {
      // Audit must not break the user-facing operation; swallow & rely on logs.
    }
  }

  list(params: { skip?: number; take?: number }) {
    const take = Math.min(params.take ?? 50, 200);
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: params.skip ?? 0,
      take,
    });
  }

  count() {
    return this.prisma.auditLog.count();
  }
}
