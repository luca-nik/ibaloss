/**
 * types.ts — The shapes of all the data in the app.
 *
 * Think of this file as the "vocabulary of the vocabulary app": it describes
 * what a Word is, what a Verb is, and what we remember about how well you
 * know each of them. These shapes are shared by every other file, so they
 * live here in one neutral place.
 */

/** A card can be asked in two directions: Italian→French or French→Italian. */
export type Direction = 'it-fr' | 'fr-it';

/** How the user did on a card: failed it, knew it, or found it trivial. */
export type Grade = 'again' | 'good' | 'easy';

/** Where a card is in its learning life. */
export type CardState = 'new' | 'learning' | 'review';

/**
 * What the app remembers about one card (one direction of one word, or one
 * tense of one verb). The scheduling algorithm reads and updates this.
 */
export interface CardProgress {
  /** Next day the card should be reviewed, as a local date 'YYYY-MM-DD'. */
  due: string;
  /** Current gap between reviews, in days. */
  interval: number;
  /** How fast the gap grows (starts at 2.5; shrinks when you fail, grows when it's easy). */
  ease: number;
  /** How many times this card has been reviewed. */
  reps: number;
  /** How many times this card was failed. Used to prioritize "difficult" cards. */
  lapses: number;
  state: CardState;
}

/**
 * The languages the app can teach. Only French is enabled for now; German and
 * Spanish are visible in the picker but marked "coming soon". The flag is an
 * emoji because the user explicitly asked for flags here.
 */
export const LANGUAGES = [
  { id: 'fr', label: 'Francese', flag: '🇫🇷', enabled: true },
  { id: 'de', label: 'Tedesco', flag: '🇩🇪', enabled: false },
  { id: 'es', label: 'Spagnolo', flag: '🇪🇸', enabled: false },
] as const;

export type LangId = (typeof LANGUAGES)[number]['id'];

/** A vocabulary entry: one Italian ↔ target-language pair. */
export interface Word {
  id: string;
  it: string;
  /** The word in the target language (field kept as `fr` for simplicity). */
  fr: string;
  /** Which language this word belongs to. */
  lang: LangId;
  /** Free-text label matching the textbook, e.g. "Capitolo 4". Optional. */
  chapter: string;
  /** Optional hint, e.g. gender or usage. */
  note?: string;
  createdAt: number;
  /** Each direction is learned (and scheduled) independently. */
  progress: Record<Direction, CardProgress>;
}

/** The six French verb persons, in fixed order. */
export const PERSONS = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'] as const;

/** One form per person: [je, tu, il/elle, nous, vous, ils/elles]. */
export type Conj = [string, string, string, string, string, string];

/** The tenses the app can quiz. Add a line here to support a new tense. */
export const TENSES = [
  { id: 'present', label: 'Présent' },
  { id: 'passe_compose', label: 'Passé composé' },
  { id: 'imparfait', label: 'Imparfait' },
  { id: 'futur', label: 'Futur simple' },
  { id: 'conditionnel', label: 'Conditionnel présent' },
  { id: 'subjonctif', label: 'Subjonctif présent' },
] as const;

export type TenseId = (typeof TENSES)[number]['id'];

/**
 * A verb with its conjugation tables. The user fills in only the tenses
 * they have actually studied; each tense gets its own review schedule.
 */
export interface Verb {
  id: string;
  /** Infinitive in the target language, e.g. "parler". */
  infinitive: string;
  /** Italian translation, e.g. "parlare". */
  it: string;
  /** Which language this verb belongs to. */
  lang: LangId;
  chapter: string;
  tenses: Partial<Record<TenseId, Conj>>;
  progress: Partial<Record<TenseId, CardProgress>>;
  createdAt: number;
}

/** What happened on one day: how many cards graded, how many of them failed. */
export interface DayActivity {
  graded: number;
  again: number;
}

/** User-tunable settings. */
export interface Settings {
  /** How many never-seen cards a daily session may introduce. */
  newPerDay: number;
  /** Maximum cards in one daily session (the user can always play another round). */
  sessionCap: number;
  /** The language currently being studied. */
  lang: LangId;
}

/** Everything the app stores. Persisted as a whole in the local database. */
export interface AppState {
  words: Word[];
  verbs: Verb[];
  /** What happened each day ('YYYY-MM-DD' → counters). Used for streak and stats. */
  activity: Record<string, DayActivity>;
  settings: Settings;
}
