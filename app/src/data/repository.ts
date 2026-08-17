/**
 * repository.ts — Loading and saving the app's data.
 *
 * The app keeps four things in the local database: the words, the verbs,
 * the settings, and the daily activity log (for streaks and stats). This
 * file offers a small, readable set of functions for that — screens never
 * talk to the database directly, they go through the central store
 * (state/StoreContext.tsx), which in turn calls these functions.
 *
 * Also here: export/import of ALL data as one JSON object (used for
 * backups), and a small "migration" step that upgrades data saved by
 * older versions of the app to the current shape.
 */
import type { AppState, CardProgress, DayActivity, Verb, Word } from '@/core/types';
import { scheduler } from '@/core/scheduler';
import { kvGet, kvSet, kvDel } from './kv';

/** The keys under which each piece of data is stored. */
const KEYS = {
  words: 'words',
  verbs: 'verbs',
  settings: 'settings',
  activity: 'activity',
} as const;

/** A complete, valid, empty state — used on first launch. */
export const EMPTY_STATE: AppState = {
  words: [],
  verbs: [],
  activity: {},
  settings: { newPerDay: 10, sessionCap: 30, lang: 'fr' },
};

/**
 * Fill in fields that older saves (or older backup files) may not have:
 * the language of each entry, the failure counter on each card, the newer
 * settings, and the richer per-day activity format. Anything missing gets
 * a sensible default, so old data keeps working after an app update.
 *
 * Words used to have one progress PER DIRECTION (it-fr / fr-it). Now a word
 * is a single card asked in a random direction: when we meet the old shape,
 * we keep the progress of the most-practised direction.
 */
function migrate(raw: AppState): AppState {
  const fixProgress = (p: CardProgress): CardProgress => ({ ...p, lapses: p.lapses ?? 0 });

  const mergeWordProgress = (p: unknown): CardProgress => {
    const rec = p as Record<string, CardProgress> | undefined;
    if (rec && typeof rec === 'object' && 'due' in rec) return fixProgress(rec as unknown as CardProgress);
    const a = rec?.['it-fr'];
    const b = rec?.['fr-it'];
    const best = a && b ? (b.reps > a.reps ? b : a) : (a ?? b);
    return best ? fixProgress(best) : scheduler.initial();
  };

  const words: Word[] = (raw.words ?? []).map((w) => ({
    ...w,
    lang: w.lang ?? 'fr',
    progress: mergeWordProgress(w.progress),
  }));

  const verbs: Verb[] = (raw.verbs ?? []).map((v) => ({
    ...v,
    lang: v.lang ?? 'fr',
    progress: Object.fromEntries(
      Object.entries(v.progress ?? {}).map(([t, p]) => [t, fixProgress(p)]),
    ) as Verb['progress'],
  }));

  // Activity used to be a plain number per day; now it's { graded, again }.
  const activity: Record<string, DayActivity> = {};
  for (const [day, value] of Object.entries(raw.activity ?? {})) {
    activity[day] = typeof value === 'number' ? { graded: value, again: 0 } : value;
  }

  return {
    words,
    verbs,
    activity,
    settings: {
      newPerDay: raw.settings?.newPerDay ?? 10,
      sessionCap: raw.settings?.sessionCap ?? 30,
      lang: raw.settings?.lang ?? 'fr',
    },
  };
}

/** Load everything from the database (missing pieces fall back to defaults). */
export async function loadAll(): Promise<AppState> {
  const [words, verbs, activity, settings] = await Promise.all([
    kvGet<AppState['words']>(KEYS.words),
    kvGet<AppState['verbs']>(KEYS.verbs),
    kvGet<AppState['activity']>(KEYS.activity),
    kvGet<AppState['settings']>(KEYS.settings),
  ]);
  return migrate({ words: words ?? [], verbs: verbs ?? [], activity: activity ?? {}, settings: settings ?? EMPTY_STATE.settings });
}

/** Persist the whole state. Called after every change; IndexedDB is fast
 *  enough for this at the scale of a personal vocabulary. */
export async function saveAll(state: AppState): Promise<void> {
  await Promise.all([
    kvSet(KEYS.words, state.words),
    kvSet(KEYS.verbs, state.verbs),
    kvSet(KEYS.activity, state.activity),
    kvSet(KEYS.settings, state.settings),
  ]);
}

/** Serialize the whole state as pretty-printed JSON (for the backup file). */
export function exportJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Parse a backup file back into a state. Returns null if the file doesn't
 * look like one of our backups (so the caller can show an error and keep
 * the existing data untouched).
 */
export function parseImport(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as AppState;
    if (!Array.isArray(parsed.words) || !Array.isArray(parsed.verbs)) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

/** Remove every key — used by the "erase all data" button. */
export async function wipeAll(): Promise<void> {
  await Promise.all([kvDel(KEYS.words), kvDel(KEYS.verbs), kvDel(KEYS.activity), kvDel(KEYS.settings)]);
}
