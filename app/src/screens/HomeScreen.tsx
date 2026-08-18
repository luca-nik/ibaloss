/**
 * HomeScreen.tsx — The dashboard you see when the app opens.
 *
 * Answers three questions at a glance: how many cards are waiting for me
 * today? how many new ones will I learn? how many days in a row have I
 * studied? From here you start the daily session, or practice a single
 * chapter of your textbook on demand.
 */
import { useState } from 'react';
import { BookOpen, Dumbbell, Flame, GraduationCap, Layers, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/state/StoreContext';
import { allChapters, currentStreak, sessionCounts } from '@/core/session';
import LanguagePicker from '@/components/LanguagePicker';
import { LANGUAGES } from '@/core/types';

interface Props {
  onStartDaily: () => void;
  onStartChapter: (chapter: string) => void;
  onStartPractice: () => void;
}

export default function HomeScreen({ onStartDaily, onStartChapter, onStartPractice }: Props) {
  const { state } = useStore();
  const [chapter, setChapter] = useState<string>('');

  if (!state) return null;

  const counts = sessionCounts(state);
  const streak = currentStreak(state.activity);
  const chapters = allChapters(state);
  const empty = state.words.length === 0 && state.verbs.length === 0;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      {/* Header with a decorative tropical band + language picker */}
      <div className="relative overflow-hidden rounded-t-md border-2 border-tropical-charcoal/15 bg-tropical-yellow p-6 shadow-pop">
        <div className="bg-tropical-dots absolute inset-0" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">iBaloss</h1>
            <p className="mt-1 font-accent text-tropical-charcoal/70">
              {LANGUAGES.find((l) => l.id === state.settings.lang)?.label ?? ''} · vocabolario e
              coniugazioni, un ripasso al giorno
            </p>
          </div>
          <LanguagePicker />
        </div>
      </div>

      {/* The three daily numbers */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-2 border-tropical-charcoal/15">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Layers className="h-5 w-5 text-primary" />
            <span className="font-mono text-2xl font-bold">{counts.due}</span>
            <span className="text-center text-xs text-muted-foreground">da ripassare</span>
          </CardContent>
        </Card>
        <Card className="border-2 border-tropical-charcoal/15">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <GraduationCap className="h-5 w-5 text-tropical-cyan" />
            <span className="font-mono text-2xl font-bold">{counts.fresh}</span>
            <span className="text-center text-xs text-muted-foreground">nuove oggi</span>
          </CardContent>
        </Card>
        <Card className="border-2 border-tropical-charcoal/15">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Flame className="h-5 w-5 text-tropical-orange" />
            <span className="font-mono text-2xl font-bold">{streak}</span>
            <span className="text-center text-xs text-muted-foreground">giorni di fila</span>
          </CardContent>
        </Card>
      </div>

      {/* The one big button of the app */}
      <Button
        size="lg"
        variant="cta"
        className="h-16 w-full border-2 border-tropical-charcoal/20 text-xl shadow-pop"
        onClick={onStartDaily}
        disabled={counts.total === 0}
      >
        <Play className="mr-2 h-6 w-6" />
        Inizia la sessione ({counts.total})
      </Button>
      {counts.due > counts.total && (
        <p className="-mt-3 text-center text-xs text-muted-foreground">
          …e altre {counts.due - Math.min(counts.due, state.settings.sessionCap)} in attesa: le
          vedrai continuando a giocare, o domani.
        </p>
      )}

      {/* Practice on demand: a shuffled round from the whole deck, anytime —
          even when the daily session is done or there is nothing due. */}
      <Button
        size="lg"
        variant="outline"
        className="w-full border-2 border-tropical-charcoal/20"
        onClick={onStartPractice}
        disabled={empty}
      >
        <Dumbbell className="mr-2 h-5 w-5" /> Allenati comunque
      </Button>

      {/* Friendly empty state for first-time users */}
      {empty && (
        <Card className="border-2 border-dashed border-tropical-charcoal/25">
          <CardContent className="p-6 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-tropical-orange" />
            <p className="font-semibold text-foreground">Nessuna parola ancora</p>
            <p className="mt-1 font-accent text-sm">
              Aggiungi le parole e i verbi del capitolo che stai studiando: li ritroverai qui nel
              ripasso quotidiano.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chapter practice: everything in one chapter, on demand */}
      {chapters.length > 0 && (
        <Card className="border-2 border-tropical-charcoal/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ripassa un capitolo</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Select value={chapter} onValueChange={setChapter}>
              <SelectTrigger className="flex-1 rounded-t-sm">
                <SelectValue placeholder="Scegli il capitolo…" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" disabled={!chapter} onClick={() => onStartChapter(chapter)}>
              <Play className="mr-1 h-4 w-4" /> Vai
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-center font-mono text-xs text-muted-foreground">
        {state.words.length} parole · {state.verbs.length} verbi nel tuo vocabolario
      </p>
    </div>
  );
}
