/**
 * StatsScreen.tsx — Your progress, with a playful twist.
 *
 * A light-hearted dashboard (emojis on purpose — you asked for them!):
 * streak and best streak, overall accuracy, how much vocabulary you've
 * collected, activity over the last 7 days, and "le tue nemiche": the
 * cards you fail most often, so you know what to attack next.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/state/StoreContext';
import { bestStreak, currentStreak, tenseLabel, verbTenseIds } from '@/core/session';
import { addDays, todayStr } from '@/core/dates';
import type { TenseId } from '@/core/types';

/** One row of the "hardest cards" list. */
interface Nemesis {
  label: string;
  detail: string;
  lapses: number;
}

export default function StatsScreen() {
  const { state } = useStore();
  if (!state) return null;

  const lang = state.settings.lang;
  const words = state.words.filter((w) => w.lang === lang);
  const verbs = state.verbs.filter((v) => v.lang === lang);

  // ── Global numbers ────────────────────────────────────────────────────────
  const dayEntries = Object.values(state.activity);
  const totalGraded = dayEntries.reduce((n, d) => n + d.graded, 0);
  const totalAgain = dayEntries.reduce((n, d) => n + d.again, 0);
  const accuracy = totalGraded ? Math.round(((totalGraded - totalAgain) / totalGraded) * 100) : 0;
  const streak = currentStreak(state.activity);
  const record = bestStreak(state.activity);
  const totalCards =
    words.length * 2 + verbs.reduce((n, v) => n + verbTenseIds(v).length, 0);

  // ── Last 7 days (for the mini bar chart) ─────────────────────────────────
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(todayStr(), i - 6);
    return { day, count: state.activity[day]?.graded ?? 0 };
  });
  const maxDay = Math.max(1, ...week.map((d) => d.count));
  const dayLetters = ['D', 'L', 'M', 'M', 'G', 'V', 'S']; // Dom, Lun... (JS: 0=Sunday)

  // ── "Le tue nemiche": the cards with the most failures ────────────────────
  const nemeses: Nemesis[] = [
    ...words.flatMap((w) => [
      { label: w.it, detail: w.fr, lapses: w.progress['it-fr'].lapses + w.progress['fr-it'].lapses },
    ]),
    ...verbs.flatMap((v) =>
      verbTenseIds(v).map((t: TenseId) => ({
        label: v.infinitive,
        detail: tenseLabel(t),
        lapses: v.progress[t]?.lapses ?? 0,
      })),
    ),
  ]
    .filter((n) => n.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 5);

  const nothingYet = totalGraded === 0;

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <h2 className="mb-2 text-3xl font-bold">Le tue statistiche 📊</h2>

      {nothingYet && (
        <Card className="border-2 border-dashed border-tropical-charcoal/25">
          <CardContent className="p-6 text-center">
            <p className="text-4xl">🌱</p>
            <p className="mt-2 font-semibold">Ancora tutto da scoprire!</p>
            <p className="mt-1 font-accent text-sm text-muted-foreground">
              Fai la prima sessione e torna qui: le statistiche prenderanno vita.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Streak + accuracy + collection */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-2 border-tropical-charcoal/15">
          <CardContent className="p-4 text-center">
            <p className="text-3xl">🔥</p>
            <p className="font-mono text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">giorni di fila</p>
            <p className="mt-1 text-xs">🏆 record: {record}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-tropical-charcoal/15">
          <CardContent className="p-4 text-center">
            <p className="text-3xl">🎯</p>
            <p className="font-mono text-2xl font-bold">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">ricordate al primo colpo</p>
            <p className="mt-1 text-xs">🃏 {totalGraded} ripassate in totale</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-tropical-charcoal/15">
          <CardContent className="p-4 text-center">
            <p className="text-3xl">📚</p>
            <p className="font-mono text-2xl font-bold">{words.length + verbs.length}</p>
            <p className="text-xs text-muted-foreground">voci nel vocabolario</p>
            <p className="mt-1 text-xs">🧩 {totalCards} carte da esercitare</p>
          </CardContent>
        </Card>

        {/* Last 7 days mini chart */}
        <Card className="border-2 border-tropical-charcoal/15">
          <CardContent className="p-4">
            <p className="mb-2 text-center text-xs text-muted-foreground">📅 ultimi 7 giorni</p>
            <div className="flex h-20 items-end justify-around gap-1">
              {week.map((d) => {
                const weekday = dayLetters[new Date(d.day + 'T12:00:00').getDay()];
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full max-w-6 rounded-t-lg ${d.count ? 'bg-tropical-orange' : 'bg-secondary'}`}
                      style={{ height: `${Math.max(8, (d.count / maxDay) * 64)}px` }}
                      title={`${d.day}: ${d.count} carte`}
                    />
                    <span className="font-mono text-[10px] text-muted-foreground">{weekday}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hardest cards */}
      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Le tue nemiche 😈</CardTitle>
        </CardHeader>
        <CardContent>
          {nemeses.length === 0 ? (
            <p className="py-2 text-center font-accent text-sm text-muted-foreground">
              Nessuna nemica all'orizzont… continua così! 😎
            </p>
          ) : (
            <ul className="divide-y">
              {nemeses.map((n, i) => (
                <li key={`${n.label}-${n.detail}`} className="flex items-center gap-3 py-2">
                  <span className="text-lg">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                  <span className="flex-1 font-semibold">
                    {n.label} <span className="font-accent font-normal text-muted-foreground">({n.detail})</span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {n.lapses} {n.lapses === 1 ? 'errore' : 'errori'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 font-accent text-xs text-muted-foreground">
            Non preoccuparti: l'algoritmo te le ripropone più spesso proprio per questo. 💪
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
