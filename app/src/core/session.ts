/**
 * session.ts — Building today's quiz queue.
 *
 * This file decides WHICH cards you see when you press "start session".
 * It does not decide when cards are due (that's the scheduler's job);
 * it collects what's due, sorts it, applies the daily limit, adds a few
 * new cards, and shuffles.
 *
 * Two kinds of session:
 *  - Daily session: at most `sessionCap` cards (default ~30). Due cards
 *    come first, PRIORITIZED: the most overdue and the most-failed cards
 *    are shown first. Remaining slots are filled with new cards (up to
 *    `newPerDay`). If more cards are due after the session, the app offers
 *    a "keep playing" button that simply builds another session.
 *  - Chapter practice: everything in one chapter, no limits (like flipping
 *    through the chapter you just studied).
 */
import type { AppState, CardProgress, Direction, TenseId, Verb, Word } from './types';
import { TENSES } from './types';
import { todayStr, addDays, daysBetween } from './dates';

export { todayStr, addDays };

/** Is this card waiting to be reviewed today (or overdue)? */
export function isDue(p: CardProgress): boolean {
  return p.state !== 'new' && p.due <= todayStr();
}

/**
 * How urgently a due card should be shown: overdue days count the most,
 * past failures break the tie (cards you keep forgetting come first).
 */
function priorityOf(p: CardProgress): number {
  return daysBetween(p.due, todayStr()) * 10 + p.lapses;
}

/** Shuffle helper (Fisher–Yates): returns a new array, input untouched. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * One question in a quiz session. Either a word (the direction is drawn
 * randomly when the card is built, and re-drawn if it is re-queued), or a
 * verb in one tense at one (randomly chosen) person.
 */
export type QuizItem =
  | { kind: 'word'; key: string; word: Word; dir: Direction; isNew: boolean }
  | { kind: 'verb'; key: string; verb: Verb; tense: TenseId; personIdx: number; isNew: boolean };

/** Toss a coin: which direction will this word be asked in? */
export function randomDir(): Direction {
  return Math.random() < 0.5 ? 'it-fr' : 'fr-it';
}

/** Which tenses of this verb actually have forms filled in (and can be quizzed). */
export function verbTenseIds(verb: Verb): TenseId[] {
  return TENSES.map((t) => t.id).filter((id) => {
    const conj = verb.tenses[id];
    return conj && conj.some((f) => f.trim() !== '');
  });
}

/** Collect every card (one per word + one per verb tense), split into due vs new. */
function collect(state: AppState, chapter?: string) {
  const lang = state.settings.lang;
  const due: { item: QuizItem; priority: number }[] = [];
  const news: QuizItem[] = [];

  for (const w of state.words) {
    if (w.lang !== lang) continue;
    if (chapter && w.chapter !== chapter) continue;
    const p = w.progress;
    const item: QuizItem = { kind: 'word', key: w.id, word: w, dir: randomDir(), isNew: p.state === 'new' };
    if (p.state === 'new') news.push(item);
    else if (chapter || isDue(p)) due.push({ item, priority: priorityOf(p) });
  }

  for (const v of state.verbs) {
    if (v.lang !== lang) continue;
    if (chapter && v.chapter !== chapter) continue;
    for (const t of verbTenseIds(v)) {
      const p = v.progress[t];
      const isNew = !p || p.state === 'new';
      const item: QuizItem = {
        kind: 'verb',
        key: `${v.id}:${t}`,
        verb: v,
        tense: t,
        personIdx: Math.floor(Math.random() * 6),
        isNew,
      };
      if (isNew) news.push(item);
      else if (chapter || isDue(p!)) due.push({ item, priority: priorityOf(p!) });
    }
  }

  return { due, news };
}

export interface SessionCounts {
  due: number; // all cards waiting for review today (may exceed the session cap)
  fresh: number; // new cards a session would introduce (capped by settings)
  total: number; // what one daily session actually contains
}

/** What today's daily session would contain — shown on the home screen. */
export function sessionCounts(state: AppState): SessionCounts {
  const { due, news } = collect(state);
  const cap = state.settings.sessionCap;
  const reviewSlots = Math.min(due.length, cap);
  const fresh = Math.min(news.length, state.settings.newPerDay, Math.max(0, cap - reviewSlots));
  return { due: due.length, fresh, total: reviewSlots + fresh };
}

/** Build the ordered list of questions for one session. */
export function buildSession(state: AppState, chapter?: string): QuizItem[] {
  const { due, news } = collect(state, chapter);

  if (chapter) {
    // Chapter practice: no caps, no priorities — everything, shuffled.
    return shuffle([...due.map((d) => d.item), ...news]);
  }

  // Shuffle first (random tiebreak), then stable-sort by urgency.
  const reviewPart = shuffle(due)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, state.settings.sessionCap)
    .map((d) => d.item);

  // New cards fill only the slots left free by the reviews.
  const slotsLeft = Math.max(0, state.settings.sessionCap - reviewPart.length);
  const newPart = shuffle(news).slice(0, Math.min(state.settings.newPerDay, slotsLeft));

  return [...reviewPart, ...newPart];
}

/**
 * The current streak: how many consecutive days (ending today, or yesterday
 * if today hasn't started yet) had at least one graded card.
 */
export function currentStreak(activity: AppState['activity']): number {
  let streak = 0;
  let cursor = todayStr();
  if (!activity[cursor]?.graded) cursor = addDays(cursor, -1);
  while (activity[cursor]?.graded > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** The longest streak ever achieved (for the statistics screen). */
export function bestStreak(activity: AppState['activity']): number {
  const days = Object.keys(activity).filter((d) => activity[d].graded > 0).sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** All chapter labels in use for the current language, sorted naturally. */
export function allChapters(state: AppState): string[] {
  const lang = state.settings.lang;
  const set = new Set<string>();
  for (const w of state.words) if (w.lang === lang && w.chapter) set.add(w.chapter);
  for (const v of state.verbs) if (v.lang === lang && v.chapter) set.add(v.chapter);
  return [...set].sort((a, b) => a.localeCompare(b, 'it', { numeric: true }));
}

/** Human-readable label for a tense id, e.g. 'passe_compose' → 'Passé composé'. */
export function tenseLabel(id: TenseId): string {
  return TENSES.find((t) => t.id === id)?.label ?? id;
}

/** Short status text for a card in the library, e.g. "da ripassare" or "→ 21/08/2026". */
export function dueLabel(p: CardProgress): string {
  if (p.state === 'new') return 'nuova';
  if (p.due <= todayStr()) return 'da ripassare';
  return `→ ${p.due.split('-').reverse().join('/')}`;
}
