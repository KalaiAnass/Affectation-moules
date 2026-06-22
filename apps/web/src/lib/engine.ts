/**
 * Browser-side compatibility engine (bilingual FR/EN).
 *
 * Faithful, self-contained copy of the canonical `@mpc/engine` so the web app
 * runs fully client-side — no backend, no database — deployable as a static
 * site. The canonical engine (packages/engine) is the source of truth and is
 * the one covered by unit tests; the only addition here is per-language
 * `details` / `instruction` text so the verdicts are fully explainable in
 * French or English.
 */
import pressesData from './data/presses.json';
import moldsData from './data/molds.json';
import type {
  CompatibilityResult,
  Lang,
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

const CLEARANCE_MM = 5;
/** Max platen overhang (mm) tolerated for a rotated mold (mountable as a condition). */
const PLATEN_OVERHANG_MM = 50;

function capacity(
  rule: string,
  label: string,
  labelFr: string,
  pressVal: number,
  moldVal: number,
  unit: string,
  unitFr: string,
  lang: Lang,
): RuleResult {
  const ok = pressVal >= moldVal;
  const u = lang === 'fr' ? (unitFr ? ` ${unitFr}` : '') : unit ? ` ${unit}` : '';
  return {
    rule,
    label,
    labelFr,
    // Equipment shortfall is a condition (amber), not a hard block.
    status: ok ? 'PASS' : 'ADAPTATION',
    press: `${pressVal}${u}`,
    mold: `${moldVal}${u}`,
    details: ok
      ? lang === 'fr'
        ? `Presse ${pressVal}${u} ≥ moule ${moldVal}${u}.`
        : `Press ${pressVal}${u} ≥ mold ${moldVal}${u}.`
      : lang === 'fr'
        ? `Sous condition : capacité presse inférieure au besoin (presse ${pressVal}${u} < moule ${moldVal}${u}).`
        : `Condition — press capacity below mold need (press ${pressVal}${u} < mold ${moldVal}${u}).`,
  };
}

function ruleThickness(press: Press, mold: Mold, lang: Lang): RuleResult {
  const ok = mold.thicknessEm >= press.minThickness && mold.thicknessEm <= press.maxThickness;
  const fr = lang === 'fr';
  let details: string;
  if (ok) {
    details = fr
      ? `Moule ${mold.thicknessEm} mm dans la plage presse ${press.minThickness}–${press.maxThickness} mm.`
      : `Mold ${mold.thicknessEm} mm within press window ${press.minThickness}–${press.maxThickness} mm.`;
  } else if (mold.thicknessEm < press.minThickness) {
    details = fr
      ? `Moule ${mold.thicknessEm} mm sous le minimum ${press.minThickness} mm.`
      : `Mold ${mold.thicknessEm} mm below minimum ${press.minThickness} mm.`;
  } else {
    details = fr
      ? `Moule ${mold.thicknessEm} mm au-dessus du maximum ${press.maxThickness} mm.`
      : `Mold ${mold.thicknessEm} mm above maximum ${press.maxThickness} mm.`;
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

function ruleMountability(press: Press, mold: Mold, lang: Lang): RuleResult {
  const c = CLEARANCE_MM;
  const fr = lang === 'fr';
  const Lc = press.tieBarWidth;
  const Hc = press.tieBarHeight;
  const Lp = press.platenWidth;
  const Hp = press.platenHeight;
  const { widthLm: Lm, heightHm: Hm, thicknessEm: Em } = mold;

  const base = {
    rule: 'mountability',
    label: 'Mountability',
    labelFr: 'Montabilité',
    press: fr
      ? `entre-colonnes ${Lc}×${Hc} mm, plateau ${Lp}×${Hp} mm`
      : `tie-bars ${Lc}×${Hc} mm, platen ${Lp}×${Hp} mm`,
    mold: `L ${Lm} × H ${Hm} × E ${Em} mm`,
  } as const;

  const wFits = Lm <= Lc - c;
  const hFits = Hm <= Hc - c;

  // Standard entry.
  if (wFits && hFits) {
    return {
      ...base,
      status: 'PASS',
      details: fr
        ? `Entrée standard : Lm ${Lm} ≤ ${Lc - c} et Hm ${Hm} ≤ ${Hc - c}.`
        : `Standard entry: Lm ${Lm} ≤ ${Lc - c} and Hm ${Hm} ≤ ${Hc - c}.`,
    };
  }

  // Width fits but the mold is too tall: turn it before lowering it in from the
  // top. Possible only if its thickness clears the tie-bar gap (Em ≤ Lc-5).
  if (wFits && !hFits) {
    if (Em <= Lc - c) {
      // Turning the mold is a normal SMED step, not an anomaly => PASS (green).
      return {
        ...base,
        status: 'PASS',
        details: fr
          ? `Trop haut pour une entrée standard (Hm ${Hm} > ${Hc - c}) ; passe en tournant le moule (Em ${Em} ≤ ${Lc - c}).`
          : `Too tall for standard entry (Hm ${Hm} > ${Hc - c}); fits by turning the mold (Em ${Em} ≤ ${Lc - c}).`,
        instruction: fr
          ? 'Tourner le moule avant de le descendre par le haut dans la presse.'
          : 'Turn the mold before lowering it into the press from the top.',
      };
    }
    return {
      ...base,
      status: 'FAIL',
      details: fr
        ? `Trop haut (Hm ${Hm} > ${Hc - c}) et trop épais pour entrer en tournant (Em ${Em} > ${Lc - c}).`
        : `Too tall (Hm ${Hm} > ${Hc - c}) and too thick to turn in (Em ${Em} > ${Lc - c}).`,
    };
  }

  // Too wide but height fits: rotate 90° during insertion. The mold may overhang
  // the platen — in width AND height — by up to PLATEN_OVERHANG_MM; beyond that
  // it cannot be mounted.
  if (!wFits && hFits) {
    const rotThick = Em <= Lc - c;
    const widthFits = Lm <= Lp - c;
    const heightFits = Hm <= Hp - c;
    const widthOverhang = Lm <= Lp + PLATEN_OVERHANG_MM;
    const heightOverhang = Hm <= Hp + PLATEN_OVERHANG_MM;

    if (rotThick && widthFits && heightFits) {
      // 90° rotation is a normal SMED step, not an anomaly => PASS (green).
      return {
        ...base,
        status: 'PASS',
        details: fr
          ? `Trop large pour une entrée standard (Lm ${Lm} > ${Lc - c}) mais passe en rotation : Em ${Em} ≤ ${Lc - c}, Lm ${Lm} ≤ ${Lp - c}, Hm ${Hm} ≤ ${Hp - c}.`
          : `Too wide for standard entry (Lm ${Lm} > ${Lc - c}) but fits rotated: Em ${Em} ≤ ${Lc - c}, Lm ${Lm} ≤ ${Lp - c}, Hm ${Hm} ≤ ${Hp - c}.`,
        instruction: fr ? "Rotation requise lors de l'insertion." : 'Rotation required during insertion.',
      };
    }
    if (rotThick && widthOverhang && heightOverhang) {
      // Mountable rotated with a platen overhang up to the allowance => condition (amber).
      const ov: string[] = [];
      if (!widthFits) ov.push(fr ? `Lm ${Lm} > plateau L ${Lp - c}` : `Lm ${Lm} > platen W ${Lp - c}`);
      if (!heightFits) ov.push(fr ? `Hm ${Hm} > plateau H ${Hp - c}` : `Hm ${Hm} > platen H ${Hp - c}`);
      return {
        ...base,
        status: 'ADAPTATION',
        details: fr
          ? `Montable en rotation avec débord plateau ≤ ${PLATEN_OVERHANG_MM} mm (${ov.join(', ')}).`
          : `Mountable rotated with platen overhang ≤ ${PLATEN_OVERHANG_MM} mm (${ov.join(', ')}).`,
        instruction: fr
          ? `Rotation requise, avec débord plateau ≤ ${PLATEN_OVERHANG_MM} mm.`
          : `Rotation required, with platen overhang ≤ ${PLATEN_OVERHANG_MM} mm.`,
      };
    }
    const reasons: string[] = [];
    if (!rotThick) reasons.push(`Em ${Em} > ${Lc - c}`);
    if (!widthOverhang)
      reasons.push(
        fr
          ? `Lm ${Lm} > plateau L+${PLATEN_OVERHANG_MM} ${Lp + PLATEN_OVERHANG_MM}`
          : `Lm ${Lm} > platen W+${PLATEN_OVERHANG_MM} ${Lp + PLATEN_OVERHANG_MM}`,
      );
    if (!heightOverhang)
      reasons.push(
        fr
          ? `Hm ${Hm} > plateau H+${PLATEN_OVERHANG_MM} ${Hp + PLATEN_OVERHANG_MM}`
          : `Hm ${Hm} > platen H+${PLATEN_OVERHANG_MM} ${Hp + PLATEN_OVERHANG_MM}`,
      );
    return {
      ...base,
      status: 'FAIL',
      details: fr
        ? `Trop large pour une entrée standard et rotation impossible (${reasons.join(', ')}).`
        : `Too wide for standard entry and cannot be rotated (${reasons.join(', ')}).`,
    };
  }

  // Too large in both directions.
  return {
    ...base,
    status: 'FAIL',
    details: fr
      ? `Trop grand dans les deux sens (Lm ${Lm} > ${Lc - c} et Hm ${Hm} > ${Hc - c}).`
      : `Too large in both directions (Lm ${Lm} > ${Lc - c} and Hm ${Hm} > ${Hc - c}).`,
  };
}

function ruleMag(press: Press, mold: Mold, lang: Lang): RuleResult {
  const fr = lang === 'fr';
  const same = press.magType !== '' && press.magType === mold.magType;
  const studs = press.hasLocatingStuds
    ? fr
      ? ' + plots'
      : ' + studs'
    : fr
      ? ' (sans plots)'
      : ' (no studs)';
  const base = {
    rule: 'mag',
    label: 'MAG / Clamping',
    labelFr: 'Bridage (MAG)',
    press: `${press.magTypeRaw}${studs}`,
    mold: mold.magTypeRaw || '—',
  } as const;

  if (same && press.hasLocatingStuds) {
    return {
      ...base,
      status: 'PASS',
      details: fr
        ? `Même bridage (${press.magTypeRaw}) et presse équipée de plots de centrage.`
        : `Same bridage (${press.magTypeRaw}) and press is equipped with locating studs.`,
      instruction: fr ? 'Utiliser les plots de centrage.' : 'Use locating studs.',
    };
  }
  if (same && !press.hasLocatingStuds) {
    return {
      ...base,
      status: 'ADAPTATION',
      details: fr
        ? `Même bridage (${press.magTypeRaw}) mais presse sans plots de centrage.`
        : `Same bridage (${press.magTypeRaw}) but press has no locating studs.`,
      instruction: fr ? 'Utiliser une rondelle de centrage.' : 'Use centering washer.',
    };
  }
  return {
    ...base,
    status: 'ADAPTATION',
    details: fr
      ? `Bridage différent (presse ${press.magTypeRaw || '—'} vs moule ${mold.magTypeRaw || '—'}).`
      : `Different bridage (press ${press.magTypeRaw || '—'} vs mold ${mold.magTypeRaw || '—'}).`,
    instruction: fr ? 'Utiliser une rondelle de centrage.' : 'Use centering washer.',
  };
}

function ruleHeatingZones(press: Press, mold: Mold, lang: Lang): RuleResult {
  return capacity('heatingZones', 'Heating Zones', 'Zones de chauffe', press.heatingZones, mold.heatingZones, '', '', lang);
}

function ruleHydraulicCores(press: Press, mold: Mold, lang: Lang): RuleResult {
  const fr = lang === 'fr';
  const pfOk = press.hydraulicPF >= mold.hydraulicPF;
  const pmOk = press.hydraulicPM >= mold.hydraulicPM;
  const ok = pfOk && pmOk;
  const reasons: string[] = [];
  if (!pfOk) reasons.push(fr ? `PF presse ${press.hydraulicPF} < moule ${mold.hydraulicPF}` : `PF press ${press.hydraulicPF} < mold ${mold.hydraulicPF}`);
  if (!pmOk) reasons.push(fr ? `PM presse ${press.hydraulicPM} < moule ${mold.hydraulicPM}` : `PM press ${press.hydraulicPM} < mold ${mold.hydraulicPM}`);
  return {
    rule: 'hydraulicCores',
    label: 'Hydraulic Cores',
    labelFr: 'Noyaux hydrauliques',
    status: ok ? 'PASS' : 'ADAPTATION',
    press: `PF ${press.hydraulicPF} / PM ${press.hydraulicPM}`,
    mold: `PF ${mold.hydraulicPF} / PM ${mold.hydraulicPM}`,
    details: ok
      ? fr
        ? `La presse couvre les deux circuits (PF ${press.hydraulicPF}≥${mold.hydraulicPF}, PM ${press.hydraulicPM}≥${mold.hydraulicPM}).`
        : `Press covers both circuits (PF ${press.hydraulicPF}≥${mold.hydraulicPF}, PM ${press.hydraulicPM}≥${mold.hydraulicPM}).`
      : fr
        ? `Sous condition : ${reasons.join(' ; ')}.`
        : `Condition — ${reasons.join('; ')}.`,
  };
}

function ruleThermoregulation(press: Press, mold: Mold, lang: Lang): RuleResult {
  const fr = lang === 'fr';
  const pfOk = press.thermoPF >= mold.thermoPF;
  const pmOk = press.thermoPM >= mold.thermoPM;
  const gridOk = press.thermoGrid >= mold.thermoGrid;
  const ok = pfOk && pmOk && gridOk;
  const grid = fr ? 'grille' : 'grid';
  const reasons: string[] = [];
  if (!pfOk) reasons.push(fr ? `PF presse ${press.thermoPF} < moule ${mold.thermoPF}` : `PF press ${press.thermoPF} < mold ${mold.thermoPF}`);
  if (!pmOk) reasons.push(fr ? `PM presse ${press.thermoPM} < moule ${mold.thermoPM}` : `PM press ${press.thermoPM} < mold ${mold.thermoPM}`);
  if (!gridOk) reasons.push(fr ? `${grid} presse ${press.thermoGrid} < moule ${mold.thermoGrid}` : `${grid} press ${press.thermoGrid} < mold ${mold.thermoGrid}`);
  return {
    rule: 'thermoregulation',
    label: 'Thermoregulation',
    labelFr: 'Thermorégulation',
    status: ok ? 'PASS' : 'ADAPTATION',
    press: `PF ${press.thermoPF} / PM ${press.thermoPM} / ${grid} ${press.thermoGrid}`,
    mold: `PF ${mold.thermoPF} / PM ${mold.thermoPM} / ${grid} ${mold.thermoGrid}`,
    details: ok
      ? fr
        ? 'La presse couvre tous les branchements thermo.'
        : 'Press covers all thermo connections.'
      : fr
        ? `Sous condition : ${reasons.join(' ; ')}.`
        : `Condition — ${reasons.join('; ')}.`,
  };
}

function ruleSequential(press: Press, mold: Mold, lang: Lang): RuleResult {
  return capacity('sequential', 'Sequential Control', 'Séquentiel', press.sequentialOutputs, mold.sequentialNozzles, 'outlets', 'voies', lang);
}

function ruleClampingForce(press: Press, mold: Mold, lang: Lang): RuleResult {
  return capacity('clampingForce', 'Clamping Force', 'Force de fermeture', press.clampingForce, mold.requiredClampingForce, 't', 't', lang);
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

export function checkCompatibility(press: Press, mold: Mold, lang: Lang = 'fr'): CompatibilityResult {
  const rules = RULE_EVALUATORS.map((evaluate) => evaluate(press, mold, lang));
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

const ruleLabel = (r: RuleResult, lang: Lang) => (lang === 'fr' ? r.labelFr : r.label);

const conditionLabels = (rules: ReturnType<typeof checkCompatibility>['rules'], lang: Lang): string[] =>
  rules.filter((x) => x.status === 'ADAPTATION').map((x) => ruleLabel(x, lang));

export function compatibilityMatrix(mold: Mold, presses: Press[], lang: Lang = 'fr'): MatrixEntry[] {
  return presses.map((press) => {
    const r = checkCompatibility(press, mold, lang);
    return {
      pressId: press.id,
      decision: r.decision,
      requiresAdaptation: r.requiresAdaptation,
      blockingRuleLabels: r.blockingRules.map((x) => ruleLabel(x, lang)),
      conditionRuleLabels: conditionLabels(r.rules, lang),
    };
  });
}

export function reverseSearch(press: Press, molds: Mold[], lang: Lang = 'fr'): ReverseEntry[] {
  return molds.map((mold) => {
    const r = checkCompatibility(press, mold, lang);
    return {
      moldId: mold.id,
      designation: mold.designation,
      decision: r.decision,
      requiresAdaptation: r.requiresAdaptation,
      blockingRuleLabels: r.blockingRules.map((x) => ruleLabel(x, lang)),
      conditionRuleLabels: conditionLabels(r.rules, lang),
    };
  });
}
