/**
 * Normalisation helpers shared by the data extractor and the rules engine.
 *
 * The source workbook (Équipement des presses — Hénin-Beaumont) mixes a few
 * encodings for the same concept:
 *   - counts written as composites, e.g. "2+1" meaning two fixed + one mobile,
 *   - "NA" for "not applicable" (sequential nozzles) which the spec maps to 0,
 *   - "#REF!" for broken spreadsheet formulas (treated as unknown / null),
 *   - "oui"/"non" booleans,
 *   - clamping bridage labels "MAG 3", "MAG  3", "MAG2", "Design 3"...
 *
 * Keeping this logic in one place guarantees the persisted dataset and any
 * runtime parsing agree exactly.
 */

/** Parse a count cell into a number. Composites like "2+1" are summed. */
export function parseCount(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (s === '') return null;
  if (/^na$/i.test(s)) return 0; // "NA" => 0 (per spec, Rule 9)
  if (/#ref!?/i.test(s) || /#n\/?a/i.test(s)) return null; // broken formula => unknown
  // Composite "a+b(+c)" => sum of the integer parts
  if (s.includes('+')) {
    const parts = s.split('+').map((p) => parseInt(p.trim(), 10));
    if (parts.every((n) => Number.isFinite(n))) return parts.reduce((a, b) => a + b, 0);
  }
  // Leading number, possibly followed by a note e.g. "1 VISIERE A PART"
  const m = s.match(/-?\d+(?:[.,]\d+)?/);
  if (m) return parseFloat(m[0].replace(',', '.'));
  return null;
}

/** Same as parseCount but returns 0 instead of null (for required numeric fields). */
export function parseCountOrZero(raw: unknown): number {
  const v = parseCount(raw);
  return v === null ? 0 : v;
}

/** Parse a numeric measurement (mm, tonnes). Returns null when absent/invalid. */
export function parseNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim().replace(',', '.');
  if (s === '' || /#ref!?/i.test(s)) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** "oui"/"yes"/"1"/true => true ; "non"/"no"/"0"/false/blank => false. */
export function parseBool(raw: unknown): boolean {
  if (raw === null || raw === undefined) return false;
  if (typeof raw === 'boolean') return raw;
  const s = String(raw).trim().toLowerCase();
  return s === 'oui' || s === 'yes' || s === '1' || s === 'true' || s === 'o';
}

/**
 * Canonical bridage / MAG token, used for equality in Rule 5.
 * "MAG 3" / "MAG  3" / "mag3" -> "MAG3" ; "Design 2" -> "DESIGN2" ;
 * bare "MAG" -> "MAG" (ambiguous, never equal to a numbered MAG).
 */
export function normalizeMag(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).toUpperCase().replace(/[\s_-]+/g, '').trim();
}

/** Normalise a commissioning year: 2-digit years (e.g. 91) become 1991. */
export function normalizeYear(raw: unknown): number | null {
  const n = parseNumber(raw);
  if (n === null) return null;
  if (n < 100) return n >= 0 ? 1900 + n : null;
  return n;
}

/** Collapse internal whitespace/newlines in a label cell. */
export function cleanText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).replace(/\s+/g, ' ').trim();
}
