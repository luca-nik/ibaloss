export type Direction = 'it-fr' | 'fr-it';

export type CardState = 'new' | 'learning' | 'review';

export interface CardProgress {
  /** Due date as local 'YYYY-MM-DD' */
  due: string;
  /** Interval in days */
  interval: number;
  /** Ease factor (SM-2 style) */
  ease: number;
  reps: number;
  state: CardState;
}

export interface Word {
  id: string;
  it: string;
  fr: string;
  chapter: string;
  note?: string;
  createdAt: number;
  progress: Record<Direction, CardProgress>;
}

export const TENSES = [
  { id: 'present', label: 'Présent' },
  { id: 'passe_compose', label: 'Passé composé' },
  { id: 'imparfait', label: 'Imparfait' },
  { id: 'futur', label: 'Futur simple' },
  { id: 'conditionnel', label: 'Conditionnel présent' },
  { id: 'subjonctif', label: 'Subjonctif présent' },
] as const;

export type TenseId = (typeof TENSES)[number]['id'];

export const PERSONS = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'] as const;

/** [je, tu, il/elle, nous, vous, ils/elles] */
export type Conj = [string, string, string, string, string, string];

export interface Verb {
  id: string;
  /** French infinitive */
  infinitive: string;
  /** Italian translation */
  it: string;
  chapter: string;
  tenses: Partial<Record<TenseId, Conj>>;
  createdAt: number;
  progress: Partial<Record<TenseId, CardProgress>>;
}

export interface Settings {
  newPerDay: number;
}

export interface AppState {
  words: Word[];
  verbs: Verb[];
  /** date 'YYYY-MM-DD' -> number of graded items that day */
  activity: Record<string, number>;
  settings: Settings;
}

export type Grade = 'again' | 'good' | 'easy';
