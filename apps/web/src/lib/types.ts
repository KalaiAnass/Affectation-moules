export type RuleStatus = 'PASS' | 'FAIL' | 'ADAPTATION';
export type Decision = 'COMPATIBLE' | 'NOT_COMPATIBLE';

export interface RuleResult {
  rule: string;
  label: string;
  labelFr: string;
  status: RuleStatus;
  press: string;
  mold: string;
  details: string;
  instruction?: string;
}

export interface CompatibilityResult {
  pressId: string;
  moldId: string;
  decision: Decision;
  requiresAdaptation: boolean;
  rules: RuleResult[];
  blockingRules: RuleResult[];
}

export interface Press {
  id: string;
  brand: string;
  commissioningYear: number | null;
  magTypeRaw: string;
  clampingForce: number;
  heatingZones: number;
  tieBarWidth: number;
  tieBarHeight: number;
}

export interface Mold {
  id: string;
  designation: string;
  projectRef: string;
  heightHm: number;
  widthLm: number;
  thicknessEm: number;
  magTypeRaw: string;
  requiredClampingForce: number;
  heatingZones: number;
}

export interface MatrixEntry {
  pressId: string;
  decision: Decision;
  requiresAdaptation: boolean;
  blockingRuleLabels: string[];
}

export interface ReverseEntry {
  moldId: string;
  designation: string;
  decision: Decision;
  requiresAdaptation: boolean;
  blockingRuleLabels: string[];
}

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  roles: string[];
}

export interface AuditItem {
  id: string;
  createdAt: string;
  action: string;
  userEmail: string | null;
  pressId: string | null;
  moldId: string | null;
  decision: string | null;
  requiresAdaptation: boolean | null;
  ip: string | null;
}
