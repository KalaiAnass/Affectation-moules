/**
 * Reproducible data extraction from the vendored Hénin-Beaumont workbook.
 *
 *   node scripts/extract.mjs
 *
 * Reads  data/source/equipement-presses.xlsm  (an OOXML zip), parses the
 * presses sheet (Feuil2) and molds sheet (Feuil1), normalises every cell, and
 * writes:
 *   - data/presses.json          (seed for the database / inspection)
 *   - data/molds.json
 *   - src/dataset.generated.ts   (typed, bundler-safe import for the engine)
 *
 * The normalisation here mirrors src/normalize.ts exactly; the test suite
 * validates the generated dataset against known workbook values, so any drift
 * is caught immediately.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SRC = join(root, 'data', 'source', 'equipement-presses.xlsm');

// ---------------------------------------------------------------------------
// Normalisation (mirror of src/normalize.ts)
// ---------------------------------------------------------------------------
const parseCount = (raw) => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (s === '') return null;
  if (/^na$/i.test(s)) return 0;
  if (/#ref!?/i.test(s) || /#n\/?a/i.test(s)) return null;
  if (s.includes('+')) {
    const parts = s.split('+').map((p) => parseInt(p.trim(), 10));
    if (parts.every((n) => Number.isFinite(n))) return parts.reduce((a, b) => a + b, 0);
  }
  const m = s.match(/-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(',', '.')) : null;
};
const parseCountOrZero = (raw) => {
  const v = parseCount(raw);
  return v === null ? 0 : v;
};
const parseNumber = (raw) => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim().replace(',', '.');
  if (s === '' || /#ref!?/i.test(s)) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};
const numOrZero = (raw) => {
  const v = parseNumber(raw);
  return v === null ? 0 : v;
};
const parseBool = (raw) => {
  if (raw === null || raw === undefined) return false;
  const s = String(raw).trim().toLowerCase();
  return s === 'oui' || s === 'yes' || s === '1' || s === 'true' || s === 'o';
};
const normalizeMag = (raw) =>
  raw === null || raw === undefined ? '' : String(raw).toUpperCase().replace(/[\s_-]+/g, '').trim();
const normalizeYear = (raw) => {
  const n = parseNumber(raw);
  if (n === null) return null;
  return n < 100 ? (n >= 0 ? 1900 + n : null) : n;
};
const cleanText = (raw) => (raw === null || raw === undefined ? '' : String(raw).replace(/\s+/g, ' ').trim());

// ---------------------------------------------------------------------------
// Minimal OOXML reader
// ---------------------------------------------------------------------------
const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

function parseSharedStrings(xml) {
  const sst = [];
  const reSi = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = reSi.exec(xml))) {
    const reT = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let t;
    const parts = [];
    while ((t = reT.exec(m[1]))) parts.push(t[1]);
    sst.push(cleanText(decodeEntities(parts.join(''))));
  }
  return sst;
}

const colNum = (c) => {
  let n = 0;
  for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
};

function parseSheet(xml, sst) {
  const reRow = /<row[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  const rows = {};
  let r;
  while ((r = reRow.exec(xml))) {
    const rn = +r[1];
    const cells = {};
    const reC = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let c;
    while ((c = reC.exec(r[2]))) {
      const attrs = c[1];
      const body = c[2] || '';
      const rm = /\br="([A-Z]+)\d+"/.exec(attrs);
      if (!rm) continue;
      const tm = /\bt="([^"]+)"/.exec(attrs);
      const type = tm ? tm[1] : null;
      let val = '';
      const vm = /<v>([\s\S]*?)<\/v>/.exec(body);
      if (vm) {
        val = type === 's' ? sst[+vm[1]] ?? '' : decodeEntities(vm[1]);
      } else {
        const im = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/.exec(body);
        if (im) val = decodeEntities(im[1]);
      }
      if (val !== '') cells[rm[1]] = String(val);
    }
    rows[rn] = cells;
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------
const zip = unzipSync(new Uint8Array(readFileSync(SRC)));
const read = (name) => strFromU8(zip[name]);

const sst = parseSharedStrings(read('xl/sharedStrings.xml'));
const pressRows = parseSheet(read('xl/worksheets/sheet2.xml'), sst); // Feuil2 = presses
const moldRows = parseSheet(read('xl/worksheets/sheet1.xml'), sst); // Feuil1 = molds

const G = (row, col) => (row[col] === undefined ? null : row[col]);

// Presses — data rows 5..39, identified by a non-empty id in column B.
const presses = [];
for (let r = 5; r <= 39; r++) {
  const row = pressRows[r];
  if (!row) continue;
  const id = cleanText(G(row, 'B'));
  if (!id || /^moulage/i.test(id)) continue;
  presses.push({
    id,
    brand: cleanText(G(row, 'C')),
    commissioningYear: normalizeYear(G(row, 'D')),
    magType: normalizeMag(G(row, 'E')),
    magTypeRaw: cleanText(G(row, 'E')),
    reversibleWasherDiameter: parseNumber(G(row, 'F')),
    hasLocatingStuds: parseBool(G(row, 'G')),
    maxOpeningStroke: parseNumber(G(row, 'H')),
    maxThickness: numOrZero(G(row, 'I')),
    minThickness: numOrZero(G(row, 'J')),
    tieBarWidth: numOrZero(G(row, 'K')),
    tieBarHeight: numOrZero(G(row, 'L')),
    platenWidth: numOrZero(G(row, 'M')),
    platenHeight: numOrZero(G(row, 'N')),
    hydraulicPF: parseCountOrZero(G(row, 'O')),
    hydraulicPM: parseCountOrZero(G(row, 'P')),
    sequentialMax: parseCount(G(row, 'Q')),
    sequentialOutputs: parseCountOrZero(G(row, 'R')),
    heatingZones: parseCountOrZero(G(row, 'S')),
    connectorType: cleanText(G(row, 'T')),
    thermoPF: parseCountOrZero(G(row, 'U')),
    thermoPM: parseCountOrZero(G(row, 'V')),
    thermoGrid: parseCountOrZero(G(row, 'W')),
    clampingForce: numOrZero(G(row, 'X')),
  });
}

// Molds — data rows 6..21, identified by a N° moule HBT in column E.
const molds = [];
for (let r = 6; r <= 21; r++) {
  const row = moldRows[r];
  if (!row) continue;
  const id = cleanText(G(row, 'E'));
  if (!id) continue;
  molds.push({
    id,
    projectRef: cleanText(G(row, 'B')),
    designation: cleanText(G(row, 'C')),
    heightHm: numOrZero(G(row, 'F')),
    widthLm: numOrZero(G(row, 'G')),
    thicknessEm: numOrZero(G(row, 'H')),
    isStandard: parseBool(G(row, 'I')),
    isReversible: parseBool(G(row, 'J')),
    cavities: cleanText(G(row, 'K')) || '1',
    magType: normalizeMag(G(row, 'L')),
    magTypeRaw: cleanText(G(row, 'L')),
    centeringWasherDiameter: parseNumber(G(row, 'M')),
    hydraulicPF: parseCountOrZero(G(row, 'N')),
    hydraulicPM: parseCountOrZero(G(row, 'O')),
    heatingZones: parseCountOrZero(G(row, 'P')),
    connectorType: cleanText(G(row, 'Q')),
    waterCircuits: parseCount(G(row, 'R')),
    nozzles: parseCountOrZero(G(row, 'S')),
    sequentialNozzles: parseCountOrZero(G(row, 'T')),
    thermoPF: parseCountOrZero(G(row, 'U')),
    thermoPM: parseCountOrZero(G(row, 'V')),
    thermoGrid: parseCountOrZero(G(row, 'W')),
    requiredClampingForce: numOrZero(G(row, 'X')),
  });
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
writeFileSync(join(root, 'data', 'presses.json'), JSON.stringify(presses, null, 2) + '\n');
writeFileSync(join(root, 'data', 'molds.json'), JSON.stringify(molds, null, 2) + '\n');

const banner = `/* AUTO-GENERATED by scripts/extract.mjs — do not edit by hand.
 * Source: data/source/equipement-presses.xlsm (Forvia Hénin-Beaumont).
 * Regenerate with: npm run extract --workspace @mpc/engine
 */`;
const generated = `${banner}
import type { Press, Mold } from './types.js';

export const PRESSES: Press[] = ${JSON.stringify(presses, null, 2)};

export const MOLDS: Mold[] = ${JSON.stringify(molds, null, 2)};
`;
writeFileSync(join(root, 'src', 'dataset.generated.ts'), generated);

console.log(`Extracted ${presses.length} presses and ${molds.length} molds.`);
console.log('Wrote data/presses.json, data/molds.json, src/dataset.generated.ts');
