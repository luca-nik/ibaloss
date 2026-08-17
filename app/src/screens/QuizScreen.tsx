/**
 * QuizScreen.tsx — The review session, the heart of the app.
 *
 * It receives a ready-made queue of questions (built by core/session.ts)
 * and walks the user through them, one card at a time:
 *
 *   WORD card  → show one side, user recalls the other, taps to reveal,
 *                then self-grades: "Non la sapevo" / "La sapevo" / "Facile".
 *   VERB card  → show infinitive + tense + person, user TYPES the form,
 *                the app checks it exactly (accents included).
 *
 * Cards graded "again" are put back at the end of the queue, so you see
 * them once more before the session ends. The actual scheduling math is
 * the scheduler's business — this screen only reports the grade.
 */
import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AccentBar from '@/components/AccentBar';
import { useStore } from '@/state/StoreContext';
import { conjugationMatches } from '@/core/normalize';
import { sessionCounts, tenseLabel, randomDir, type QuizItem } from '@/core/session';
import { PERSONS, type Grade } from '@/core/types';

interface Props {
  initialItems: QuizItem[];
  /** Shown above the progress bar, e.g. "Sessione di oggi" or "Capitolo 4". */
  title: string;
  onExit: () => void;
  /** Offered at the end when more due cards are waiting ("keep playing"). */
  onPlayMore?: () => void;
}

/** Where we are with the current card: asking → revealed/checked → next. */
type Phase = 'ask' | 'reveal' | 'checked';

export default function QuizScreen({ initialItems, title, onExit, onPlayMore }: Props) {
  const { state, gradeWord, gradeVerb } = useStore();
  const [queue, setQueue] = useState<QuizItem[]>(initialItems);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('ask');
  const [typed, setTyped] = useState('');
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ graded: 0, again: 0 });
  // Remembers which cards were already counted, so re-queued "again" cards
  // don't inflate the final summary.
  const gradedKeys = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const item = queue[idx];
  const done = idx >= queue.length;

  // A verb table may have some empty persons; quiz only the filled ones.
  const verbPersonIdx = useMemo(() => {
    if (!item || item.kind !== 'verb') return 0;
    const conj = item.verb.tenses[item.tense]!;
    const valid = conj.map((f, i) => (f.trim() ? i : -1)).filter((i) => i >= 0);
    return valid.length ? valid[item.personIdx % valid.length] : 0;
  }, [item]);

  /** Put a failed card back at the end of the queue (verbs get a new random
   *  person, words get a new random direction). */
  function requeue(it: QuizItem) {
    const fresh: QuizItem =
      it.kind === 'verb'
        ? { ...it, personIdx: Math.floor(Math.random() * 6) }
        : { ...it, dir: randomDir() };
    setQueue((q) => [...q, fresh]);
  }

  /** Report the grade to the store (which forwards it to the scheduler). */
  function recordGrade(it: QuizItem, g: Grade) {
    if (it.kind === 'word') gradeWord(it.word.id, g);
    else gradeVerb(it.verb.id, it.tense, g);
    if (!gradedKeys.current.has(it.key)) {
      gradedKeys.current.add(it.key);
      setStats((s) => ({ graded: s.graded + 1, again: s.again + (g === 'again' ? 1 : 0) }));
    }
    if (g === 'again') requeue(it);
  }

  function next() {
    setPhase('ask');
    setTyped('');
    setWasCorrect(null);
    setIdx((i) => i + 1);
  }

  function grade(g: Grade) {
    if (!item) return;
    recordGrade(item, g);
    next();
  }

  /** Check a typed conjugation. Correct = "good"; wrong is handled on continue. */
  function checkVerb() {
    if (!item || item.kind !== 'verb') return;
    const expected = item.verb.tenses[item.tense]![verbPersonIdx];
    const ok = conjugationMatches(typed, expected);
    setWasCorrect(ok);
    setPhase('checked');
    if (ok) recordGrade(item, 'good');
  }

  /** Continue after a wrong conjugation: "again", unless the user says it was a typo. */
  function verbWrongContinue(typo: boolean) {
    if (!item || item.kind !== 'verb') return;
    recordGrade(item, typo ? 'good' : 'again');
    next();
  }

  // ── Session finished: summary screen ──────────────────────────────────────
  if (done) {
    const pct = stats.graded ? Math.round(((stats.graded - stats.again) / stats.graded) * 100) : 0;
    // Are there still due cards that didn't fit in this round?
    const moreWaiting = state ? sessionCounts(state).total > 0 : false;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-t-md bg-tropical-yellow shadow-pop">
          <Sparkles className="h-10 w-10 text-tropical-charcoal" />
        </div>
        <h2 className="mb-2 text-3xl font-bold">Sessione completata!</h2>
        <p className="mb-8 text-muted-foreground">
          {stats.graded} carte ripassate · {pct}% ricordate al primo colpo
        </p>
        <div className="flex flex-col items-center gap-3">
          {moreWaiting && onPlayMore && (
            <Button onClick={onPlayMore} size="lg" className="shadow-pop">
              Continua a giocare
            </Button>
          )}
          <Button onClick={onExit} size="lg" variant={moreWaiting && onPlayMore ? 'outline' : 'cta'} className="shadow-pop">
            Torna alla home
          </Button>
        </div>
      </div>
    );
  }

  const progressPct = queue.length ? Math.round((idx / queue.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Header: exit button + progress */}
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onExit} aria-label="Esci dalla sessione">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="mb-1 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{title}</span>
            <span>
              {idx + 1} / {queue.length}
            </span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
        </div>
      </div>

      {item.kind === 'word' ? (
        <WordCard item={item} phase={phase} onReveal={() => setPhase('reveal')} onGrade={grade} />
      ) : (
        <VerbCard
          item={item}
          personIdx={verbPersonIdx}
          phase={phase}
          typed={typed}
          wasCorrect={wasCorrect}
          inputRef={inputRef}
          onType={setTyped}
          onCheck={checkVerb}
          onContinue={() => (wasCorrect ? next() : verbWrongContinue(false))}
          onTypo={() => verbWrongContinue(true)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Word card: flip + self-grade
// ─────────────────────────────────────────────────────────────────────────────

function WordCard({
  item,
  phase,
  onReveal,
  onGrade,
}: {
  item: Extract<QuizItem, { kind: 'word' }>;
  phase: Phase;
  onReveal: () => void;
  onGrade: (g: Grade) => void;
}) {
  const fromIt = item.dir === 'it-fr';
  const prompt = fromIt ? item.word.it : item.word.fr;
  const answer = fromIt ? item.word.fr : item.word.it;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline">{fromIt ? 'Italiano → Francese' : 'Francese → Italiano'}</Badge>
        {item.word.chapter && <Badge variant="secondary">{item.word.chapter}</Badge>}
        {item.isNew && <Badge className="bg-tropical-green text-tropical-charcoal">nuova</Badge>}
      </div>

      {/* The card itself: tap to reveal the answer */}
      <Card
        className={`select-none border-2 border-tropical-charcoal/15 transition-all duration-200 ${
          phase === 'ask' ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lift' : ''
        }`}
        onClick={phase === 'ask' ? onReveal : undefined}
      >
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-3xl font-semibold">{prompt}</p>
          {phase === 'reveal' ? (
            <>
              <div className="h-1 w-20 rounded-full bg-tropical-orange" />
              <p className="text-2xl font-semibold text-primary">{answer}</p>
              {item.word.note && <p className="font-accent text-sm text-muted-foreground">{item.word.note}</p>}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Pensa alla risposta, poi tocca la carta</p>
          )}
        </CardContent>
      </Card>

      {/* Self-grading buttons appear only after the reveal */}
      {phase === 'reveal' && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button variant="destructive" onClick={() => onGrade('again')} autoFocus>
            <RotateCcw className="mr-1 h-4 w-4" /> Non la sapevo
          </Button>
          <Button
            onClick={() => onGrade('good')}
            className="bg-tropical-cyan text-white hover:bg-tropical-cyan/90"
          >
            <Check className="mr-1 h-4 w-4" /> La sapevo
          </Button>
          <Button
            variant="outline"
            className="border-tropical-charcoal/25 bg-tropical-green/25 hover:bg-tropical-green/45"
            onClick={() => onGrade('easy')}
          >
            <Sparkles className="mr-1 h-4 w-4" /> Facile
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Verb card: typed conjugation, checked exactly
// ─────────────────────────────────────────────────────────────────────────────

function VerbCard({
  item,
  personIdx,
  phase,
  typed,
  wasCorrect,
  inputRef,
  onType,
  onCheck,
  onContinue,
  onTypo,
}: {
  item: Extract<QuizItem, { kind: 'verb' }>;
  personIdx: number;
  phase: Phase;
  typed: string;
  wasCorrect: boolean | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onType: (v: string) => void;
  onCheck: () => void;
  onContinue: () => void;
  onTypo: () => void;
}) {
  const expected = item.verb.tenses[item.tense]![personIdx];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline">Coniugazione</Badge>
        {item.verb.chapter && <Badge variant="secondary">{item.verb.chapter}</Badge>}
        {item.isNew && <Badge className="bg-tropical-green text-tropical-charcoal">nuova</Badge>}
      </div>

      <Card className="border-2 border-tropical-charcoal/15">
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-3xl font-semibold">{item.verb.infinitive}</p>
          <p className="font-accent text-muted-foreground">({item.verb.it})</p>
          <p className="mt-3 text-lg">
            <span className="rounded-full bg-tropical-blue/25 px-3 py-1 font-semibold">{tenseLabel(item.tense)}</span>
            {' · '}
            <span className="font-semibold">{PERSONS[personIdx]}</span>
          </p>
        </CardContent>
      </Card>

      {phase === 'ask' ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onCheck();
          }}
        >
          <Input
            ref={inputRef}
            value={typed}
            onChange={(e) => onType(e.target.value)}
            placeholder="Scrivi la forma coniugata…"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            className="h-13 border-2 py-3 text-center text-lg"
          />
          <AccentBar />
          <Button type="submit" variant="cta" className="w-full" size="lg" disabled={!typed.trim()}>
            Verifica
          </Button>
        </form>
      ) : (
        <div className="mt-4 space-y-3 text-center">
          {wasCorrect ? (
            <div className="flex items-center justify-center gap-2 rounded-t-sm border-2 border-tropical-charcoal/15 bg-tropical-green/30 p-4">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Corretto! «{expected}»</span>
            </div>
          ) : (
            <div className="rounded-t-sm border-2 border-primary/40 bg-primary/10 p-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <X className="h-5 w-5" />
                <span className="font-semibold">
                  La forma corretta è «<strong>{expected}</strong>»
                </span>
              </div>
              {typed.trim() && <p className="mt-1 text-sm text-muted-foreground">Tu hai scritto: «{typed.trim()}»</p>}
            </div>
          )}
          {wasCorrect ? (
            <Button className="w-full" size="lg" onClick={onContinue} autoFocus>
              Continua
            </Button>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <Button className="w-full" size="lg" onClick={onContinue} autoFocus>
                Continua (la rivedremo presto)
              </Button>
              <Button variant="ghost" size="sm" onClick={onTypo}>
                Era solo un errore di battitura — la sapevo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
