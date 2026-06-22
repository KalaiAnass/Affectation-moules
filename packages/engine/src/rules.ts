/**
 * The ten compatibility rules, implemented exactly as specified and grounded in
 * the Hénin-Beaumont workbook semantics. Each rule is a pure function returning
 * a {@link RuleResult}. The engine ({@link ./engine}) composes them and derives
 * the final decision.
 *
 * Every dimensional comparison uses a 5 mm safety clearance (CLEARANCE_MM),
 * mirroring the original "Lc - 5 / Hc - 5" formulas.
 */
import type { Mold, Press, RuleResult } from './types.js';

/** Safety clearance applied to every clamping-area dimension (mm). */
export const CLEARANCE_MM = 5;

/**
 * Max width by which a rotated mold may overhang the press platen and still be
 * mountable (as a condition). Beyond this the mold cannot be mounted.
 */
export const PLATEN_OVERHANG_MM = 50;

/**
 * Lower-is-OK numeric comparison helper for an *equipment* condition: the press
 * capacity should cover the mold need. A shortfall is not a hard block — it is a
 * condition to satisfy (status ADAPTATION, shown amber), so the overall result
 * stays "compatible under condition" rather than "not compatible".
 */
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
    status: ok ? 'PASS' : 'ADAPTATION',
    press: `${pressVal}${u}`,
    mold: `${moldVal}${u}`,
    details: ok
      ? `Press ${pressVal}${u} ≥ mold ${moldVal}${u}.`
      : `Condition — press capacity below mold need (press ${pressVal}${u} < mold ${moldVal}${u}).`,
  };
}

/** Rule 1 — Thickness window: minThickness ≤ Em ≤ maxThickness. */
export function ruleThickness(press: Press, mold: Mold): RuleResult {
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

/**
 * Rules 2 / 3 / 4 — Mountability (entrée). Quadrants on (Lm vs Lc-5, Hm vs Hc-5):
 *   - Lm ≤ Lc-5 & Hm ≤ Hc-5            => PASS  (standard entry)
 *   - Lm ≤ Lc-5 & Hm > Hc-5            => turn the mold before lowering it in:
 *                                          OK (ADAPTATION) if Em ≤ Lc-5, else FAIL
 *   - Lm > Lc-5 & Hm ≤ Hc-5            => rotate 90°: OK (ADAPTATION) if
 *                                          Em ≤ Lc-5 AND Lm ≤ Lp-5, else FAIL
 *   - Lm > Lc-5 & Hm > Hc-5            => FAIL (too large in both directions)
 */
export function ruleMountability(press: Press, mold: Mold): RuleResult {
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

  const wFits = Lm <= Lc - c;
  const hFits = Hm <= Hc - c;

  // Standard entry.
  if (wFits && hFits) {
    return {
      ...base,
      status: 'PASS',
      details: `Standard entry: Lm ${Lm} ≤ ${Lc - c} and Hm ${Hm} ≤ ${Hc - c}.`,
    };
  }

  // Width fits but the mold is too tall: it must be turned before being lowered
  // into the press from the top. Possible only if its thickness clears the
  // tie-bar gap (Em ≤ Lc-5); otherwise it cannot enter.
  if (wFits && !hFits) {
    if (Em <= Lc - c) {
      // Turning the mold is a normal SMED step, not an anomaly => PASS (green),
      // we just surface the instruction.
      return {
        ...base,
        status: 'PASS',
        details: `Too tall for standard entry (Hm ${Hm} > ${Hc - c}); fits by turning the mold (Em ${Em} ≤ ${Lc - c}).`,
        instruction: 'Turn the mold before lowering it into the press from the top.',
      };
    }
    return {
      ...base,
      status: 'FAIL',
      details: `Too tall (Hm ${Hm} > ${Hc - c}) and too thick to turn in (Em ${Em} > ${Lc - c}).`,
    };
  }

  // Too wide but height fits: rotate 90° during insertion. The mold may overhang
  // the platen by up to PLATEN_OVERHANG_MM; beyond that it cannot be mounted.
  if (!wFits && hFits) {
    const rotThick = Em <= Lc - c;
    const platenFits = Lm <= Lp - c;
    const platenOverhang = Lm <= Lp + PLATEN_OVERHANG_MM;
    if (rotThick && platenFits) {
      // 90° rotation is a normal SMED step, not an anomaly => PASS (green).
      return {
        ...base,
        status: 'PASS',
        details: `Too wide for standard entry (Lm ${Lm} > ${Lc - c}) but fits rotated: Em ${Em} ≤ ${Lc - c}, Lm ${Lm} ≤ ${Lp - c}.`,
        instruction: 'Rotation required during insertion.',
      };
    }
    if (rotThick && platenOverhang) {
      // Mountable rotated with a platen overhang up to the allowance => condition.
      return {
        ...base,
        status: 'ADAPTATION',
        details: `Mountable rotated with platen overhang: Lm ${Lm} > platen ${Lp - c} but within ${PLATEN_OVERHANG_MM} mm overhang (≤ ${Lp + PLATEN_OVERHANG_MM}).`,
        instruction: `Rotation required, with platen overhang ≤ ${PLATEN_OVERHANG_MM} mm.`,
      };
    }
    const reasons: string[] = [];
    if (!rotThick) reasons.push(`Em ${Em} > ${Lc - c}`);
    if (!platenOverhang) reasons.push(`Lm ${Lm} > platen+${PLATEN_OVERHANG_MM} ${Lp + PLATEN_OVERHANG_MM}`);
    return {
      ...base,
      status: 'FAIL',
      details: `Too wide for standard entry and cannot be rotated (${reasons.join(', ')}).`,
    };
  }

  // Too large in both directions.
  return {
    ...base,
    status: 'FAIL',
    details: `Too large in both directions (Lm ${Lm} > ${Lc - c} and Hm ${Hm} > ${Hc - c}).`,
  };
}

/**
 * Rule 5 — Bridage / MAG compatibility & centering.
 *   - same MAG AND press has locating studs => PASS  ("Use locating studs.")
 *   - same MAG but no studs               => ADAPTATION ("Use centering washer.")
 *   - different MAG                        => ADAPTATION ("Use centering washer.")
 */
export function ruleMag(press: Press, mold: Mold): RuleResult {
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

/** Rule 6 — Heating zones: press ≥ mold. */
export function ruleHeatingZones(press: Press, mold: Mold): RuleResult {
  return capacity('heatingZones', 'Heating Zones', 'Zones de chauffe', press.heatingZones, mold.heatingZones);
}

/** Rule 7 — Hydraulic cores: press PF ≥ mold PF AND press PM ≥ mold PM. */
export function ruleHydraulicCores(press: Press, mold: Mold): RuleResult {
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
    status: ok ? 'PASS' : 'ADAPTATION',
    press: `PF ${press.hydraulicPF} / PM ${press.hydraulicPM}`,
    mold: `PF ${mold.hydraulicPF} / PM ${mold.hydraulicPM}`,
    details: ok
      ? `Press covers both circuits (PF ${press.hydraulicPF}≥${mold.hydraulicPF}, PM ${press.hydraulicPM}≥${mold.hydraulicPM}).`
      : `Condition — press capacity below mold need: ${reasons.join('; ')}.`,
  };
}

/** Rule 8 — Thermoregulation: press PF/PM/grid ≥ mold PF/PM/grid. */
export function ruleThermoregulation(press: Press, mold: Mold): RuleResult {
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
    status: ok ? 'PASS' : 'ADAPTATION',
    press: `PF ${press.thermoPF} / PM ${press.thermoPM} / grille ${press.thermoGrid}`,
    mold: `PF ${mold.thermoPF} / PM ${mold.thermoPM} / grille ${mold.thermoGrid}`,
    details: ok
      ? `Press covers all thermo connections.`
      : `Condition — press capacity below mold need: ${reasons.join('; ')}.`,
  };
}

/** Rule 9 — Sequential control: press outputs ≥ mold sequential nozzles (NA=0). */
export function ruleSequential(press: Press, mold: Mold): RuleResult {
  return capacity(
    'sequential',
    'Sequential Control',
    'Séquentiel',
    press.sequentialOutputs,
    mold.sequentialNozzles,
    'voies',
  );
}

/** Rule 10 — Clamping force: press ≥ mold required. */
export function ruleClampingForce(press: Press, mold: Mold): RuleResult {
  return capacity(
    'clampingForce',
    'Clamping Force',
    'Force de fermeture',
    press.clampingForce,
    mold.requiredClampingForce,
    't',
  );
}

/** All rule evaluators in canonical display order. */
export const RULE_EVALUATORS: Array<(p: Press, m: Mold) => RuleResult> = [
  ruleThickness,
  ruleMountability,
  ruleMag,
  ruleHeatingZones,
  ruleHydraulicCores,
  ruleThermoregulation,
  ruleSequential,
  ruleClampingForce,
];
