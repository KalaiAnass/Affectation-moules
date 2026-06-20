export type RuleStatus = 'PASS' | 'FAIL' | 'ADAPTATION';
export type Decision = 'COMPATIBLE' | 'NOT_COMPATIBLE';

/** An injection press (machine) and its mounting envelope. */
export interface Press {
  id: string;
  brand: string;
  commissioningYear: number | null;
  magType: string;
  magTypeRaw: string;
  reversibleWasherDiameter: number | null;
  hasLocatingStuds: boolean;
  maxOpeningStroke: number | null;
  minThickness: number;
  maxThickness: number;
  tieBarWidth: number;
  tieBarHeight: number;
  platenWidth: number;
  platenHeight: number;
  hydraulicPF: number;
  hydraulicPM: number;
  sequentialMax: number | null;
  sequentialOutputs: number;
  heatingZones: number;
  connectorType: string;
  thermoPF: number;
  thermoPM: number;
  thermoGrid: number;
  clampingForce: number;
}

/** An injection mold (tool) and its mounting requirements. */
export interface Mold {
  id: string;
  projectRef: string;
  designation: string;
  heightHm: number;
  widthLm: number;
  thicknessEm: number;
  isStandard: boolean;
  isReversible: boolean;
  cavities: string;
  magType: string;
  magTypeRaw: string;
  centeringWasherDiameter: number | null;
  hydraulicPF: number;
  hydraulicPM: number;
  heatingZones: number;
  connectorType: string;
  waterCircuits: number | null;
  nozzles: number;
  sequentialNozzles: number;
  thermoPF: number;
  thermoPM: number;
  thermoGrid: number;
  requiredClampingForce: number;
}

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
