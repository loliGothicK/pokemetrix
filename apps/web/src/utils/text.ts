/**
 * Normalizes text for searching.
 * 1. Trims and lowercases.
 * 2. Converts Hiragana to Katakana.
 * 3. Converts full-width alphanumeric to half-width.
 */
export function normalizeForSearch(text: string): string {
  if (!text) return "";

  let normalized = text.trim().toLowerCase();

  // Convert Hiragana to Katakana
  normalized = normalized.replace(/[\u3041-\u3096]/g, (match) => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });

  // Convert full-width alphanumeric to half-width
  normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0xfee0);
  });

  return normalized;
}
