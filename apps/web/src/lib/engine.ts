/**
 * Browser-side compatibility engine.
 *
 * This is a faithful, self-contained copy of the canonical `@mpc/engine`
 * (packages/engine) so the web app runs fully client-side — no backend, no
 * database — which lets it deploy as a static site (Netlify). The canonical
 * engine remains the source of truth and is the one covered by unit tests; if
 * the ten rules change there, mirror them here.
 *
 * Dataset is the same one generated from the Hénin-Beaumont workbook.
 */
import pressesData from './data/presses.json';
import moldsData from './data/molds.json';
import type {
  CompatibilityResult,
  MatrixEntry,
  Mold,
  Press,
  ReverseEntry,
  RuleResult,
} from './types';

export const PRESSES = pressesData as Press[];
export const MOLDS = moldsData as Mold[];

const pressIndex = new Map(PRESSES.map((p) => [p.id, p]));
const moldIndex = new Map(MOLDS.map((m) => [m.id, m]));
export const getPress = (id: string): Press | undefined => pressIndex.get(id);
export const getMold = (id: string): Mold | undefined => moldIndex.get(id);

/** Safety clearance applied to every clamping-area dimension (mm). */
const CLEARANCE_MM = 5;

function capacity(
  rule: string,
  label: string,
  labelFr: string,
  pressVal: number,
  moldVal: number,
  unit = '',
): RuleResult {
  const ok = pressVal >= moldVal;
  const u = unit ? ` ${unit}` : '';
  return {
    rule,
    label,
    labelFr,
    status: ok ? 'PASS' : 'FAIL',
    press: `${pressVal}${u}`,
    mold: `${moldVal}${u}`,
    details: ok
      ? `Press ${pressVal}${u} ≥ mold ${moldVal}${u}.`
      : `Insufficient: press ${pressVal}${u} < mold ${moldVal}${u}.`,
  };
}

function ruleThickness(press: Press, mold: Mold): RuleResult {
  const ok = mold.thicknessEm >= press.minThickness && mold.thicknessEm <= press.maxThickness;
  let details: string;
  if (ok) {
    details = `Mold ${mold.thicknessEm} mm within press window ${press.minThickness}–${press.maxThickness} mm.`;
  } else if (mold.thicknessEm < press.minThickness) {
    details = `Mold ${mold.thicknessEm} mm below minimum ${press.minThickness} mm.`;
  } else {
    details = `Mold ${mold.thicknessEm} mm above maximum ${press.maxThickness} mm.`;
  }
  return {
    rule: 'thickness',
    label: 'Thickness',
    labelFr: 'Épaisseur',
    status: ok ? 'PASS' : 'FAIL',
    press: `${press.minThickness}–${press.maxThickness} mm`,
    mold: `${mold.thicknessEm} mm`,
    details,
  };
}

function ruleMountability(press: Press, mold: Mold): RuleResult {
  const c = CLEARANCE_MM;
  const Lc = press.tieBarWidth;
  const Hc = press.tieBarHeight;
  const Lp = press.platenWidth;
  const { widthLm: Lm, heightHm: Hm, thicknessEm: Em } = mold;

  const base = {
    rule: 'mountability',
    label: 'Mountability',
    labelFr: 'Montabilité',
    press: `entre-colonnes ${Lc}×${Hc} mm, plateau L ${Lp} mm`,
    mold: `L ${Lm} × H ${Hm} × E ${Em} mm`,
  } as const;

  const fitsStdW = Lm <= Lc - c;
  const fitsStdH = Hm <= Hc - c;
  if (fitsStdW && fitsStdH) {
    return { ...base, status: 'PASS', details: `Standard entry: Lm ${Lm} ≤ ${Lc - c} and Hm ${Hm} ≤ ${Hc - c}.` };
  }

  if (!fitsStdW) {
    const rotH = Hm <= Hc - c;
    const rotThick = Em <= Lc - c;
    const rotPlaten = Lm <= Lp - c;
    if (rotH && rotThick && rotPlaten) {
      return {
        ...base,
        status: 'ADAPTATION',
        details: `Too wide for standard entry (Lm ${Lm} > ${Lc - c}) but fits rotated: Hm ${Hm} ≤ ${Hc - c}, Em ${Em} ≤ ${Lc - c}, Lm ${Lm} ≤ ${Lp - c}.`,
        instruction: 'Rotation required during insertion.',
      };
    }
    const reasons: string[] = [];
    if (!rotH) reasons.push(`Hm ${Hm} > ${Hc - c}`);
    if (!rotThick) reasons.push(`Em ${Em} > ${Lc - c}`);
    if (!rotPlaten) reasons.push(`Lm ${Lm} > platen ${Lp - c}`);
    return {
      ...base,
      status: 'FAIL',
      details: `Too wide for standard entry and cannot be rotated (${reasons.join(', ')}).`,
    };
  }

  return {
    ...base,
    status: 'FAIL',
    details: `Height exceeds tie-bar height (Hm ${Hm} > ${Hc - c}); rotation not applicable.`,
  };
}

function ruleMag(press: Press, mold: Mold): RuleResult {
  const same = press.magType !== '' && press.magType === mold.magType;
  const base = {
    rule: 'mag',
    label: 'MAG / Clamping',
    labelFr: 'Bridage (MAG)',
    press: `${press.magTypeRaw}${press.hasLocatingStuds ? ' + plots' : ' (no plots)'}`,
    mold: mold.magTypeRaw || '—',
  } as const;

  if (same && press.hasLocatingStuds) {
    return {
      ...base,
      status: 'PASS',
      details: `Same bridage (${press.magTypeRaw}) and press is equipped with locating studs.`,
      instruction: 'Use locating studs.',
    };
  }
  if (same && !press.hasLocatingStuds) {
    return {
      ...base,
      status: 'ADAPTATION',
      details: `Same bridage (${press.magTypeRaw}) but press has no locating studs.`,
      instruction: 'Use centering washer.',
    };
  }
  return {
    ...base,
    status: 'ADAPTATION',
    details: `Different bridage (press ${press.magTypeRaw || '—'} vs mold ${mold.magTypeRaw || '—'}).`,
    instruction: 'Use centering washer.',
  };
}

function ruleHeatingZones(press: Press, mold: Mold): RuleResult {
  return capacity('heatingZones', 'Heating Zones', 'Zones de chauffe', press.heatingZones, mold.heatingZones);
}

function ruleHydraulicCores(press: Press, mold: Mold): RuleResult {
  const pfOk = press.hydraulicPF >= mold.hydraulicPF;
  const pmOk = press.hydraulicPM >= mold.hydraulicPM;
  const ok = pfOk && pmOk;
  const reasons: string[] = [];
  if (!pfOk) reasons.push(`PF press ${press.hydraulicPF} < mold ${mold.hydraulicPF}`);
  if (!pmOk) reasons.push(`PM press ${press.hydraulicPM} < mold ${mold.hydraulicPM}`);
  return {
    rule: 'hydraulicCores',
    label: 'Hydraulic Cores',
    labelFr: 'Noyaux hydrauliques',
    status: ok ? 'PASS' : 'FAIL',
    press: `PF ${press.hydraulicPF} / PM ${press.hydraulicPM}`,
    mold: `PF ${mold.hydraulicPF} / PM ${mold.hydraulicPM}`,
    details: ok
      ? `Press covers both circuits (PF ${press.hydraulicPF}≥${mold.hydraulicPF}, PM ${press.hydraulicPM}≥${mold.hydraulicPM}).`
      : `Insufficient: ${reasons.join('; ')}.`,
  };
}

function ruleThermoregulation(press: Press, mold: Mold): RuleResult {
  const pfOk = press.thermoPF >= mold.thermoPF;
  const pmOk = press.thermoPM >= mold.thermoPM;
  const gridOk = press.thermoGrid >= mold.thermoGrid;
  const ok = pfOk && pmOk && gridOk;
  const reasons: string[] = [];
  if (!pfOk) reasons.push(`PF press ${press.thermoPF} < mold ${mold.thermoPF}`);
  if (!pmOk) reasons.push(`PM press ${press.thermoPM} < mold ${mold.thermoPM}`);
  if (!gridOk) reasons.push(`grid press ${press.thermoGrid} < mold ${mold.thermoGrid}`);
  return {
    rule: 'thermoregulation',
    label: 'Thermoregulation',
    labelFr: 'Thermorégulation',
    status: ok ? 'PASS' : 'FAIL',
    press: `PF ${press.thermoPF} / PM ${press.thermoPM} / grille ${press.thermoGrid}`,
    mold: `PF ${mold.thermoPF} / PM ${mold.thermoPM} / grille ${mold.thermoGrid}`,
    details: ok ? `Press covers all thermo connections.` : `Insufficient: ${reasons.join('; ')}.`,
  };
}

function ruleSequential(press: Press, mold: Mold): RuleResult {
  return capacity('sequential', 'Sequential Control', 'Séquentiel', press.sequentialOutputs, mold.sequentialNozzles, 'voies');
}

function ruleClampingForce(press: Press, mold: Mold): RuleResult {
  return capacity('clampingForce', 'Clamping Force', 'Force de fermeture', press.clampingForce, mold.requiredClampingForce, 't');
}

const RULE_EVALUATORS = [
  ruleThickness,
  ruleMountability,
  ruleMag,
  ruleHeatingZones,
  ruleHydraulicCores,
  ruleThermoregulation,
  ruleSequential,
  ruleClampingForce,
];

export function checkCompatibility(press: Press, mold: Mold): CompatibilityResult {
  const rules = RULE_EVALUATORS.map((evaluate) => evaluate(press, mold));
  const blockingRules = rules.filter((r) => r.status === 'FAIL');
  const requiresAdaptation = rules.some((r) => r.status === 'ADAPTATION');
  return {
    pressId: press.id,
    moldId: mold.id,
    decision: blockingRules.length > 0 ? 'NOT_COMPATIBLE' : 'COMPATIBLE',
    requiresAdaptation,
    rules,
    blockingRules,
  };
}

export function compatibilityMatrix(mold: Mold, presses: Press[]): MatrixEntry[] {
  return presses.map((press) => {
    const r = checkCompatibility(press, mold);
    return {
      pressId: press.id,
      decision: r.decision,
      requiresAdaptation: r.requiresAdaptation,
      blockingRuleLabels: r.blockingRules.map((x) => x.label),
    };
  });
}

export function reverseSearch(press: Press, molds: Mold[]): ReverseEntry[] {
  return molds.map((mold) => {
    const r = checkCompatibility(press, mold);
    return {
      moldId: mold.id,
      designation: mold.designation,
      decision: r.decision,
      requiresAdaptation: r.requiresAdaptation,
      blockingRuleLabels: r.blockingRules.map((x) => x.label),
    };
  });
}
