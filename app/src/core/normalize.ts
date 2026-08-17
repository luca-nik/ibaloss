/**
 * normalize.ts — Comparing typed answers fairly.
 *
 * When the user types a conjugation, we want to be strict about what
 * matters (the exact letters, accents included) and forgiving about what
 * doesn't (a leading capital, extra spaces, typing the subject pronoun
 * out of habit). So both the typed answer and the expected form are
 * "normalized" — reduced to a canonical shape — before comparing.
 */

/**
 * Reduce a typed verb form to its canonical shape:
 * lowercase, single spaces, straight apostrophes, no subject pronoun.
 * ACCENTS ARE NEVER REMOVED: "parle" and "parlé" must stay different.
 */
export function normalizeAnswer(s: string): string {
  let out = s.trim().toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ');
  // Allow the user to include the subject pronoun: "je parle" ≈ "parle".
  out = out.replace(/^(je|tu|il|elle|on|nous|vous|ils|elles)\s+/, '');
  out = out.replace(/^j'/, '');
  return out;
}

/** True if the typed answer matches the expected form (after normalizing both). */
export function conjugationMatches(typed: string, expected: string): boolean {
  return normalizeAnswer(typed) === normalizeAnswer(expected);
}
