import { Injectable, NotFoundException } from '@nestjs/common';
import {
  checkCompatibility,
  compatibilityMatrix,
  reverseSearch,
  type CompatibilityResult,
  type MatrixEntry,
  type ReverseEntry,
} from '@mpc/engine';
import type { Mold, Press } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/roles.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompatibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Evaluate one mold against one press and record the decision in the audit trail. */
  async check(
    pressId: string,
    moldId: string,
    user?: AuthUser,
    ip?: string,
  ): Promise<CompatibilityResult> {
    const [press, mold] = await Promise.all([
      this.prisma.press.findUnique({ where: { id: pressId } }),
      this.prisma.mold.findUnique({ where: { id: moldId } }),
    ]);
    if (!press) throw new NotFoundException(`Press "${pressId}" not found`);
    if (!mold) throw new NotFoundException(`Mold "${moldId}" not found`);

    // Prisma rows are structurally compatible with the engine input types.
    const result = checkCompatibility(press as Press, mold as Mold);

    await this.audit.record({
      action: 'CHECK_COMPATIBILITY',
      userId: user?.userId,
      userEmail: user?.email,
      pressId,
      moldId,
      decision: result.decision,
      requiresAdaptation: result.requiresAdaptation,
      ip,
      detail: { blockingRules: result.blockingRules.map((r) => r.rule) },
    });

    return result;
  }

  /** Test one mold against every press (compatibility matrix). */
  async matrix(moldId: string): Promise<{ mold: Mold; entries: MatrixEntry[] }> {
    const mold = await this.prisma.mold.findUnique({ where: { id: moldId } });
    if (!mold) throw new NotFoundException(`Mold "${moldId}" not found`);
    const presses = await this.prisma.press.findMany({ orderBy: { clampingForce: 'desc' } });
    return { mold, entries: compatibilityMatrix(mold, presses) };
  }

  /** Test one press against every mold (reverse search). */
  async reverse(pressId: string): Promise<{ press: Press; entries: ReverseEntry[] }> {
    const press = await this.prisma.press.findUnique({ where: { id: pressId } });
    if (!press) throw new NotFoundException(`Press "${pressId}" not found`);
    const molds = await this.prisma.mold.findMany({ orderBy: { id: 'asc' } });
    return { press, entries: reverseSearch(press, molds) };
  }
}
