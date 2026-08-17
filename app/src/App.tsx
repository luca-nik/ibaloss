/**
 * App.tsx — The shell: which screen is on, and the bottom navigation.
 *
 * This app is small enough that we don't need a router: a single piece of
 * state (`view`) says which screen is visible, and the bottom bar switches
 * between them. The bar sits at the bottom because the app is designed
 * phone-first, where the thumb lives.
 */
import { useState } from 'react';
import { BookPlus, Home, LibraryBig, ListPlus, Settings, Trophy } from 'lucide-react';
import { StoreProvider, useStore } from '@/state/StoreContext';
import { buildSession, type QuizItem } from '@/core/session';
import type { Verb, Word } from '@/core/types';
import HomeScreen from '@/screens/HomeScreen';
import QuizScreen from '@/screens/QuizScreen';
import WordFormScreen from '@/screens/WordFormScreen';
import VerbFormScreen from '@/screens/VerbFormScreen';
import LibraryScreen from '@/screens/LibraryScreen';
import StatsScreen from '@/screens/StatsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import HowItWorksScreen from '@/screens/HowItWorksScreen';

/** Every screen the app can show. Forms and quiz carry the data they need. */
type View =
  | { name: 'home' }
  | { name: 'library' }
  | { name: 'stats' }
  | { name: 'settings' }
  | { name: 'how-it-works' }
  | { name: 'word-form'; editing?: Word | null }
  | { name: 'verb-form'; editing?: Verb | null }
  | { name: 'quiz'; items: QuizItem[]; title: string; sessionId: number };

/** The destinations of the bottom navigation bar. */
const TABS = [
  { view: 'home', label: 'Oggi', icon: Home },
  { view: 'word-form', label: 'Parola', icon: BookPlus },
  { view: 'verb-form', label: 'Verbo', icon: ListPlus },
  { view: 'library', label: 'Libreria', icon: LibraryBig },
  { view: 'stats', label: 'Stats', icon: Trophy },
  { view: 'settings', label: 'Opzioni', icon: Settings },
] as const;

function Shell() {
  const { state } = useStore();
  const [view, setView] = useState<View>({ name: 'home' });

  // While the saved data is being read from the local database (a split
  // second), show a soft shimmering placeholder instead of a spinner.
  if (!state) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-24 w-64 animate-pulse rounded-t-md bg-secondary" />
      </div>
    );
  }

  /** Start a session: build the queue now, then switch to the quiz screen. */
  function startSession(chapter?: string) {
    if (!state) return;
    const items = buildSession(state, chapter);
    if (items.length === 0) return;
    // sessionId tells React to treat each round as a brand-new quiz
    setView({ name: 'quiz', items, title: chapter ?? 'Sessione di oggi', sessionId: Date.now() });
  }

  const goHome = () => setView({ name: 'home' });

  return (
    // min-h-[100dvh] (not h-screen) so it behaves on mobile browsers — design rule
    <div className="min-h-[100dvh] pb-24">
      {view.name === 'home' && (
        <HomeScreen onStartDaily={() => startSession()} onStartChapter={(c) => startSession(c)} />
      )}
      {view.name === 'library' && (
        <LibraryScreen
          onEditWord={(w) => setView({ name: 'word-form', editing: w })}
          onEditVerb={(v) => setView({ name: 'verb-form', editing: v })}
        />
      )}
      {view.name === 'stats' && <StatsScreen />}
      {view.name === 'settings' && (
        <SettingsScreen onOpenHowItWorks={() => setView({ name: 'how-it-works' })} />
      )}
      {view.name === 'how-it-works' && <HowItWorksScreen />}
      {view.name === 'word-form' && <WordFormScreen editing={view.editing} onDone={goHome} />}
      {view.name === 'verb-form' && <VerbFormScreen editing={view.editing} onDone={goHome} />}
      {view.name === 'quiz' && (
        // `key` makes sure each session starts with a fresh quiz state
        <QuizScreen
          key={view.sessionId}
          initialItems={view.items}
          title={view.title}
          onExit={goHome}
          // "Continua a giocare": build a fresh session with what's still due
          onPlayMore={() => startSession()}
        />
      )}

      {/* Bottom navigation (hidden during a quiz, so nothing distracts) */}
      {view.name !== 'quiz' && (
        <nav className="fixed inset-x-0 bottom-0 z-[100] border-t-2 border-tropical-charcoal/15 bg-card">
          <div className="mx-auto flex max-w-xl justify-around">
            {TABS.map(({ view: v, label, icon: Icon }) => {
              const active = view.name === v;
              return (
                <button
                  key={v}
                  onClick={() => setView({ name: v } as View)}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                    active ? 'font-semibold text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                  {/* Active tab indicator, per design.md navigation rule */}
                  <span className={`h-1 w-8 rounded-full ${active ? 'bg-tropical-orange' : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
