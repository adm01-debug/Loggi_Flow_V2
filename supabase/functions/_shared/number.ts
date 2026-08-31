// Parses a string/number into a number, tolerating BR ("1.250,00") and US
// ("1,250.00") formats. Heuristic: the right-most separator is the decimal one.
export function parseLocaleNumber(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = String(input)
    .trim()
    .replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    s =
      lastComma > lastDot
        ? s.replace(/\./g, "").replace(",", ".") // BR: dot=thousands, comma=decimal
        : s.replace(/,/g, ""); // US: comma=thousands, dot=decimal
  } else if (lastComma > -1) {
    s = s.replace(/\./g, "").replace(",", "."); // only comma => decimal separator
  } // only dot or none => leave as-is
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
