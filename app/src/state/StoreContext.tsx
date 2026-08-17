/**
 * StoreContext.tsx — The central memory of the app.
 *
 * All data (words, verbs, progress, settings) lives here while the app is
 * running. Screens never load or save anything themselves:
 *
 *   - They READ data with `const { state } = useStore()`.
 *   - They CHANGE data by calling an action, e.g. `addWord(...)` or
 *     `gradeWord(...)`.
 *
 * After every change, the new state is written to the local database
 * (see data/repository.ts) automatically — nobody needs to remember
 * to "save".
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppState, Direction, Grade, LangId, TenseId, Verb, Word } from '@/core/types';
import { scheduler } from '@/core/scheduler';
import { todayStr } from '@/core/dates';
import { EMPTY_STATE, loadAll, saveAll, exportJson, parseImport, wipeAll } from '@/data/repository';

/** A simple unique id: random part + time part (good enough for one user's data). */
function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** What screens can read and do. */
export interface Store {
  /** null while the initial load from the database is still running. */
  state: AppState | null;
  addWord: (w: Omit<Word, 'id' | 'createdAt' | 'progress' | 'lang'>) => void;
  updateWord: (id: string, patch: Partial<Pick<Word, 'it' | 'fr' | 'chapter' | 'note'>>) => void;
  deleteWord: (id: string) => void;
  addVerb: (v: Omit<Verb, 'id' | 'createdAt' | 'progress' | 'lang'>) => void;
  updateVerb: (id: string, patch: Partial<Pick<Verb, 'infinitive' | 'it' | 'chapter' | 'tenses'>>) => void;
  deleteVerb: (id: string) => void;
  gradeWord: (id: string, dir: Direction, grade: Grade) => void;
  gradeVerb: (id: string, tense: TenseId, grade: Grade) => void;
  setNewPerDay: (n: number) => void;
  setSessionCap: (n: number) => void;
  setLang: (lang: LangId) => void;
  exportBackup: () => string;
  importBackup: (json: string) => boolean;
  resetAll: () => void;
}

const StoreContext = createContext<Store | null>(null);

/** Record one graded card in today's log (feeds the streak and the stats). */
function bumpActivity(state: AppState, grade: Grade): AppState {
  const t = todayStr();
  const day = state.activity[t] ?? { graded: 0, again: 0 };
  return {
    ...state,
    activity: {
      ...state.activity,
      [t]: { graded: day.graded + 1, again: day.again + (grade === 'again' ? 1 : 0) },
    },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  // First launch: read the saved data from the local database once.
  useEffect(() => {
    loadAll().then(setState);
  }, []);

  // After every change, persist the new state (skipping the initial null).
  useEffect(() => {
    if (state) void saveAll(state);
  }, [state]);

  const store = useMemo<Store>(() => {
    // Helper: apply a change only when the state is loaded.
    const update = (fn: (s: AppState) => AppState) => setState((s) => (s ? fn(s) : s));

    return {
      state,

      addWord: (w) =>
        update((s) => ({
          ...s,
          words: [
            ...s.words,
            {
              ...w,
              // New entries belong to the language currently being studied.
              lang: s.settings.lang,
              id: uid(),
              createdAt: Date.now(),
              // A new word starts as two independent "new" cards, one per direction.
              progress: { 'it-fr': scheduler.initial(), 'fr-it': scheduler.initial() },
            },
          ],
        })),

      updateWord: (id, patch) =>
        update((s) => ({ ...s, words: s.words.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      deleteWord: (id) => update((s) => ({ ...s, words: s.words.filter((w) => w.id !== id) })),

      addVerb: (v) =>
        update((s) => ({
          ...s,
          verbs: [...s.verbs, { ...v, lang: s.settings.lang, id: uid(), createdAt: Date.now(), progress: {} }],
        })),

      updateVerb: (id, patch) =>
        update((s) => ({ ...s, verbs: s.verbs.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),

      deleteVerb: (id) => update((s) => ({ ...s, verbs: s.verbs.filter((v) => v.id !== id) })),

      // Grading = ask the SCHEDULER for the new progress, then log the activity.
      // The store doesn't know (or care) how the algorithm computes dates.
      gradeWord: (id, dir, grade) =>
        update((s) =>
          bumpActivity(
            {
              ...s,
              words: s.words.map((w) =>
                w.id === id
                  ? { ...w, progress: { ...w.progress, [dir]: scheduler.grade(w.progress[dir], grade) } }
                  : w,
              ),
            },
            grade,
          ),
        ),

      gradeVerb: (id, tense, grade) =>
        update((s) =>
          bumpActivity(
            {
              ...s,
              verbs: s.verbs.map((v) => {
                if (v.id !== id) return v;
                const prev = v.progress[tense] ?? scheduler.initial();
                return { ...v, progress: { ...v.progress, [tense]: scheduler.grade(prev, grade) } };
              }),
            },
            grade,
          ),
        ),

      setNewPerDay: (n) =>
        update((s) => ({ ...s, settings: { ...s.settings, newPerDay: Math.max(1, n) } })),

      setSessionCap: (n) =>
        update((s) => ({ ...s, settings: { ...s.settings, sessionCap: Math.max(5, n) } })),

      setLang: (lang) => update((s) => ({ ...s, settings: { ...s.settings, lang } })),

      exportBackup: () => exportJson(state ?? EMPTY_STATE),

      importBackup: (json) => {
        const parsed = parseImport(json);
        if (!parsed) return false;
        setState(parsed);
        return true;
      },

      resetAll: () => {
        void wipeAll();
        setState(EMPTY_STATE);
      },
    };
  }, [state]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Hook used by every screen to access the central store. */
export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
