/** Application roles (mirror of Prisma `Role`). */
export enum AppRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  ENGINEER = 'ENGINEER',
  TECHNICIAN = 'TECHNICIAN',
  READ_ONLY = 'READ_ONLY',
}

/** The authenticated principal attached to each request by the JWT strategy. */
export interface AuthUser {
  /** Subject (OIDC `sub` or local user id). */
  userId: string;
  email: string;
  name?: string;
  roles: AppRole[];
}

const ROLE_ALIASES: Record<string, AppRole> = {
  ADMINISTRATOR: AppRole.ADMINISTRATOR,
  ADMIN: AppRole.ADMINISTRATOR,
  ENGINEER: AppRole.ENGINEER,
  ENGINEERING: AppRole.ENGINEER,
  TECHNICIAN: AppRole.TECHNICIAN,
  TECH: AppRole.TECHNICIAN,
  READ_ONLY: AppRole.READ_ONLY,
  READONLY: AppRole.READ_ONLY,
  VIEWER: AppRole.READ_ONLY,
};

/**
 * Normalise roles coming from a local token (single string) or an OIDC claim
 * (array or space/comma-separated string). Unknown values are dropped; an
 * authenticated principal with no recognised role falls back to READ_ONLY
 * (least privilege but still able to view).
 */
export function normalizeRoles(raw: unknown): AppRole[] {
  let tokens: string[] = [];
  if (Array.isArray(raw)) tokens = raw.map(String);
  else if (typeof raw === 'string') tokens = raw.split(/[\s,]+/);

  const roles = new Set<AppRole>();
  for (const t of tokens) {
    const key = t.toUpperCase().replace(/[\s-]+/g, '_').trim();
    const mapped = ROLE_ALIASES[key];
    if (mapped) roles.add(mapped);
  }
  return roles.size > 0 ? [...roles] : [AppRole.READ_ONLY];
}
