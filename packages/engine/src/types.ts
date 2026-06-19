/**
 * Domain types for the mold-to-press compatibility platform.
 *
 * Field names keep the engineering meaning explicit (tieBar = "entre-colonnes",
 * platen = "plateau"). The French source label for each is documented inline so
 * the mapping back to the Hénin-Beaumont workbook stays traceable.
 */

/** An injection press (machine) and its mounting envelope. */
export interface Press {
  /** N° de Presse, e.g. "2700T2" */
  id: string;
  /** Marque de la presse */
  brand: string;
  /** Mise en service (year) */
  commissioningYear: number | null;

  /** Canonical bridage token, e.g. "MAG3" (see normalizeMag) */
  magType: string;
  /** Original bridage label, e.g. "MAG 3" / "Design 2" */
  magTypeRaw: string;
  /** Ø rondelle de centrage réversible (mm) */
  reversibleWasherDiameter: number | null;
  /** Plot — locating studs present (oui/non) */
  hasLocatingStuds: boolean;

  /** Course d'ouverture MAXI (mm) */
  maxOpeningStroke: number | null;
  /** Épaisseur (E) moule mini (mm) */
  minThickness: number;
  /** Épaisseur (E) moule maxi (mm) */
  maxThickness: number;

  /** Largeur entre-colonnes — Lc (mm) */
  tieBarWidth: number;
  /** Hauteur entre-colonnes — Hc (mm) */
  tieBarHeight: number;
  /** Largeur plateau presse — Lp (mm) */
  platenWidth: number;
  /** Hauteur plateau presse — Hp (mm) */
  platenHeight: number;

  /** Noyaux — Nbr PF (hydraulic cores, fixed half) */
  hydraulicPF: number;
  /** Noyaux — Nbr PM (hydraulic cores, moving half) */
  hydraulicPM: number;

  /** Séquentiel — Nbr de voies max (may be unknown) */
  sequentialMax: number | null;
  /** Séquentiel — Nbr de voies en service */
  sequentialOutputs: number;

  /** Chauffe — Nbr de zones */
  heatingZones: number;
  /** Type de prises, e.g. "24b" */
  connectorType: string;

  /** Thermorégulateur — branchements partie fixe */
  thermoPF: number;
  /** Thermorégulateur — branchements partie mobile */
  thermoPM: number;
  /** Thermorégulateur — sur la grille */
  thermoGrid: number;

  /** Force de fermeture utile (tonnes) */
  clampingForce: number;
}

/** An injection mold (tool) and its mounting requirements. */
export interface Mold {
  /** N° moule HBT, e.g. "978" */
  id: string;
  /** Projets — internal project reference (may be empty) */
  projectRef: string;
  /** Désignation */
  designation: string;

  /** Hauteur Hm (mm) */
  heightHm: number;
  /** Largeur Lm (mm) */
  widthLm: number;
  /** Épaisseur Em (mm) */
  thicknessEm: number;

  /** Standard (oui/non) */
  isStandard: boolean;
  /** INV. — invertible / reversible (oui/non) */
  isReversible: boolean;
  /** Nb empreintes, e.g. "1" / "1+1" */
  cavities: string;

  /** Canonical bridage token */
  magType: string;
  /** Original bridage label */
  magTypeRaw: string;
  /** Ø rondelle centrale (mm) */
  centeringWasherDiameter: number | null;

  /** Noyaux — Nbr PF */
  hydraulicPF: number;
  /** Noyaux — Nbr PM */
  hydraulicPM: number;

  /** Barre chauffante — Nbr de zones */
  heatingZones: number;
  /** Type prise, e.g. "24b." */
  connectorType: string;
  /** Nbr circuits d'eau (may be unknown) */
  waterCircuits: number | null;

  /** Nbr buses */
  nozzles: number;
  /** Nbr buses séquentielles (NA => 0) */
  sequentialNozzles: number;

  /** Nbr thermo PF */
  thermoPF: number;
  /** Nbr thermo PM */
  thermoPM: number;
  /** Thermo grille HP */
  thermoGrid: number;

  /** Force de fermeture utile requise (tonnes) */
  requiredClampingForce: number;
}

export type RuleStatus = 'PASS' | 'FAIL' | 'ADAPTATION';

/** A single rule evaluation. */
export interface RuleResult {
  /** Stable machine key, e.g. "thickness" */
  rule: string;
  /** Human label (English) */
  label: string;
  /** Human label (French — plant language) */
  labelFr: string;
  status: RuleStatus;
  /** Press-side value, formatted for display */
  press: string;
  /** Mold-side value, formatted for display */
  mold: string;
  /** Explanation of the outcome */
  details: string;
  /** Action required when status === "ADAPTATION" */
  instruction?: string;
}

export type Decision = 'COMPATIBLE' | 'NOT_COMPATIBLE';

/** Full result of evaluating one mold against one press. */
export interface CompatibilityResult {
  pressId: string;
  moldId: string;
  decision: Decision;
  /** True when at least one rule required an adaptation (orange state). */
  requiresAdaptation: boolean;
  rules: RuleResult[];
  /** Convenience: the rules that caused NOT_COMPATIBLE. */
  blockingRules: RuleResult[];
}
