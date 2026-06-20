import { describe, expect, it } from 'vitest';
import {
  checkCompatibility,
  compatibilityMatrix,
  compatiblePresses,
  getMold,
  getPress,
  listMolds,
  listPresses,
  parseCount,
  parseCountOrZero,
  normalizeMag,
  normalizeYear,
  parseBool,
} from '../src/index.js';
import type { Mold, Press } from '../src/index.js';

// --- Synthetic fixtures: a generous press and a tiny mold (always compatible) ---
const bigPress: Press = {
  id: 'TEST-BIG',
  brand: 'TEST',
  commissioningYear: 2020,
  magType: 'MAG3',
  magTypeRaw: 'MAG 3',
  reversibleWasherDiameter: 127,
  hasLocatingStuds: true,
  maxOpeningStroke: 3000,
  minThickness: 100,
  maxThickness: 2000,
  tieBarWidth: 2000,
  tieBarHeight: 2000,
  platenWidth: 2500,
  platenHeight: 2500,
  hydraulicPF: 5,
  hydraulicPM: 5,
  sequentialMax: 48,
  sequentialOutputs: 24,
  heatingZones: 96,
  connectorType: '24b',
  thermoPF: 4,
  thermoPM: 4,
  thermoGrid: 2,
  clampingForce: 2700,
};

const tinyMold: Mold = {
  id: 'TEST-TINY',
  projectRef: '',
  designation: 'tiny',
  heightHm: 500,
  widthLm: 500,
  thicknessEm: 400,
  isStandard: true,
  isReversible: false,
  cavities: '1',
  magType: 'MAG3',
  magTypeRaw: 'MAG 3',
  centeringWasherDiameter: 127,
  hydraulicPF: 1,
  hydraulicPM: 1,
  heatingZones: 8,
  connectorType: '24b.',
  waterCircuits: 2,
  nozzles: 2,
  sequentialNozzles: 2,
  thermoPF: 1,
  thermoPM: 1,
  thermoGrid: 0,
  requiredClampingForce: 350,
};

describe('normalization', () => {
  it('parses composite counts by summing', () => {
    expect(parseCount('2+1')).toBe(3);
    expect(parseCount('1+2')).toBe(3);
  });
  it('maps NA to 0 and #REF! to null', () => {
    expect(parseCount('NA')).toBe(0);
    expect(parseCountOrZero('NA')).toBe(0);
    expect(parseCount('#REF!')).toBeNull();
  });
  it('extracts a leading number with a trailing note', () => {
    expect(parseCount('1 VISIERE A PART')).toBe(1);
  });
  it('canonicalises MAG / Design tokens', () => {
    expect(normalizeMag('MAG 3')).toBe('MAG3');
    expect(normalizeMag('MAG  3')).toBe('MAG3');
    expect(normalizeMag('Design 2')).toBe('DESIGN2');
    expect(normalizeMag('MAG')).toBe('MAG');
  });
  it('expands 2-digit commissioning years', () => {
    expect(normalizeYear(91)).toBe(1991);
    expect(normalizeYear(2013)).toBe(2013);
  });
  it('reads oui/non booleans', () => {
    expect(parseBool('oui')).toBe(true);
    expect(parseBool('non')).toBe(false);
  });
});

describe('dataset integrity', () => {
  it('loads the full Hénin-Beaumont dataset', () => {
    expect(listPresses()).toHaveLength(24);
    expect(listMolds()).toHaveLength(16);
  });
  it('excludes decommissioned presses (2100T, 1000T4)', () => {
    const ids = listPresses().map((p) => p.id);
    expect(ids).not.toContain('2100T');
    expect(ids).not.toContain('1000T4');
    expect(ids).toContain('2100T2');
    expect(ids).toContain('1000T5');
  });
  it('has the expected key values for press 2700T2', () => {
    const p = getPress('2700T2')!;
    expect(p).toBeDefined();
    expect(p.heatingZones).toBe(72);
    expect(p.clampingForce).toBe(2700);
    expect(p.hasLocatingStuds).toBe(false);
    expect(p.magType).toBe('MAG3');
  });
  it('has the expected key values for mold 978 (B1316)', () => {
    const m = getMold('978')!;
    expect(m.heatingZones).toBe(85);
    expect(m.widthLm).toBe(2540);
    expect(m.requiredClampingForce).toBe(1500);
  });
});

describe('canonical workbook example: 2700T2 × 978 = NOK on heating zones', () => {
  const result = checkCompatibility(getPress('2700T2')!, getMold('978')!);

  it('is NOT_COMPATIBLE', () => {
    expect(result.decision).toBe('NOT_COMPATIBLE');
  });
  it('blocks on heating zones with the workbook values (press 72 < mold 85)', () => {
    const zones = result.rules.find((r) => r.rule === 'heatingZones')!;
    expect(zones.status).toBe('FAIL');
    expect(zones.press).toContain('72');
    expect(zones.mold).toContain('85');
    expect(result.blockingRules.map((r) => r.rule)).toContain('heatingZones');
  });
  it('passes the oversize entry as a rotation (green, not a block) with its instruction', () => {
    const mount = result.rules.find((r) => r.rule === 'mountability')!;
    expect(mount.status).toBe('PASS');
    expect(mount.instruction).toMatch(/rotation/i);
  });
});

describe('real compatible case: 2700T2 × 812 = COMPATIBLE with centering washer', () => {
  const result = checkCompatibility(getPress('2700T2')!, getMold('812')!);
  it('is COMPATIBLE', () => {
    expect(result.decision).toBe('COMPATIBLE');
  });
  it('requires the centering-washer adaptation (press has no locating studs)', () => {
    expect(result.requiresAdaptation).toBe(true);
    const mag = result.rules.find((r) => r.rule === 'mag')!;
    expect(mag.status).toBe('ADAPTATION');
    expect(mag.instruction).toMatch(/washer/i);
  });
});

describe('individual rules', () => {
  it('a generous press fully covers a tiny mold (all PASS except studs handled)', () => {
    const result = checkCompatibility(bigPress, tinyMold);
    expect(result.decision).toBe('COMPATIBLE');
    expect(result.requiresAdaptation).toBe(false); // same MAG + studs => PASS, no adaptation
    expect(result.rules.every((r) => r.status === 'PASS')).toBe(true);
  });

  it('Rule 1 — thickness below the press minimum fails', () => {
    const result = checkCompatibility(bigPress, { ...tinyMold, thicknessEm: 50 });
    const t = result.rules.find((r) => r.rule === 'thickness')!;
    expect(t.status).toBe('FAIL');
    expect(result.decision).toBe('NOT_COMPATIBLE');
  });

  it('Rule 3 — an over-wide mold that fits rotated PASSes (turning is a normal SMED step)', () => {
    const wide: Mold = { ...tinyMold, widthLm: 1998, heightHm: 500, thicknessEm: 400 };
    const mount = checkCompatibility(bigPress, wide).rules.find((r) => r.rule === 'mountability')!;
    expect(mount.status).toBe('PASS');
    expect(mount.instruction).toMatch(/rotation/i);
  });

  it('Rule 4 — a mold too big in both directions FAILs mountability', () => {
    const huge: Mold = { ...tinyMold, widthLm: 3000, heightHm: 3000 };
    const result = checkCompatibility(bigPress, huge);
    const mount = result.rules.find((r) => r.rule === 'mountability')!;
    expect(mount.status).toBe('FAIL');
    expect(result.decision).toBe('NOT_COMPATIBLE');
  });

  it('Mountability — width fits but too tall: turning the mold PASSes when Em clears Lc', () => {
    // bigPress: Lc=Hc=2000 (so -5 => 1995), Lp=2500. Width OK, too tall, Em fits.
    const tall: Mold = { ...tinyMold, widthLm: 500, heightHm: 1998, thicknessEm: 400 };
    const result = checkCompatibility(bigPress, tall);
    const mount = result.rules.find((r) => r.rule === 'mountability')!;
    expect(mount.status).toBe('PASS');
    expect(mount.instruction).toMatch(/turn/i);
    // turning alone is not an anomaly => no adaptation flag from mountability
    expect(result.rules.find((r) => r.rule === 'mountability')!.status).not.toBe('ADAPTATION');
  });

  it('Mountability — too tall and too thick to turn in => FAIL', () => {
    const tallThick: Mold = { ...tinyMold, widthLm: 500, heightHm: 1998, thicknessEm: 1998 };
    const result = checkCompatibility(bigPress, tallThick);
    const mount = result.rules.find((r) => r.rule === 'mountability')!;
    expect(mount.status).toBe('FAIL');
    expect(result.decision).toBe('NOT_COMPATIBLE');
  });

  it('Rule 5 — same MAG but press without studs => centering washer adaptation', () => {
    const result = checkCompatibility({ ...bigPress, hasLocatingStuds: false }, tinyMold);
    const mag = result.rules.find((r) => r.rule === 'mag')!;
    expect(mag.status).toBe('ADAPTATION');
    expect(mag.instruction).toMatch(/washer/i);
  });

  it('Rule 5 — different MAG => centering washer adaptation', () => {
    const result = checkCompatibility(bigPress, { ...tinyMold, magType: 'MAG2', magTypeRaw: 'MAG 2' });
    const mag = result.rules.find((r) => r.rule === 'mag')!;
    expect(mag.status).toBe('ADAPTATION');
  });

  it('Rule 9 — sequential outputs below mold nozzles fails', () => {
    const result = checkCompatibility({ ...bigPress, sequentialOutputs: 1 }, { ...tinyMold, sequentialNozzles: 5 });
    expect(result.rules.find((r) => r.rule === 'sequential')!.status).toBe('FAIL');
  });

  it('Rule 10 — insufficient clamping force fails', () => {
    const result = checkCompatibility({ ...bigPress, clampingForce: 100 }, tinyMold);
    expect(result.rules.find((r) => r.rule === 'clampingForce')!.status).toBe('FAIL');
  });
});

describe('matrix & reverse search', () => {
  it('produces one matrix entry per press', () => {
    const matrix = compatibilityMatrix(getMold('812')!, listPresses());
    expect(matrix).toHaveLength(24);
  });
  it('compatiblePresses returns a subset of all press ids', () => {
    const all = new Set(listPresses().map((p) => p.id));
    const compat = compatiblePresses(getMold('812')!, listPresses());
    expect(compat.every((id) => all.has(id))).toBe(true);
  });
});
