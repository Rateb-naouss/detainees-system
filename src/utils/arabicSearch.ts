/**
 * Normalizes Arabic text for flexible search:
 * - Unifies alef forms (أ, إ, آ -> ا)
 * - Unifies teh marbuta (ة -> ه)
 * - Unifies alef maqsura (ى -> ي)
 * - Removes diacritics / tashkeel (َ, ً, ُ, ٌ, ِ, ٍ, ْ, ّ)
 */
export function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Unify alef forms
    .replace(/[أإآ]/g, 'ا')
    // Unify teh marbuta
    .replace(/ة/g, 'ه')
    // Unify alef maqsura
    .replace(/ى/g, 'ي')
    // Remove extra spaces
    .replace(/\s+/g, ' ');
}

/**
 * Checks if targetText contains query in normalized Arabic form
 */
export function arabicIncludes(targetText: string | null | undefined, query: string): boolean {
  if (!query) return true;
  if (!targetText) return false;
  const normTarget = normalizeArabic(targetText);
  const normQuery = normalizeArabic(query);
  return normTarget.includes(normQuery);
}
