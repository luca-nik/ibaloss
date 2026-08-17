/**
 * VerbFormScreen.tsx — Adding or editing one verb with its conjugations.
 *
 * You enter the verb once: infinitive, Italian translation, chapter. Then
 * you tick the tenses you have studied so far and fill in the six forms
 * for each. The quiz (QuizScreen) will then ask you random person+tense
 * combinations from these tables.
 *
 * Empty persons are allowed (e.g. you haven't learned "ils" yet) — they are
 * simply never asked. For compound tenses like passé composé, type the full
 * form including the auxiliary, e.g. "ai parlé" or "suis allé / allée".
 */
import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AccentBar from '@/components/AccentBar';
import { useStore } from '@/state/StoreContext';
import { allChapters } from '@/core/session';
import { PERSONS, TENSES, type Conj, type TenseId, type Verb } from '@/core/types';

const EMPTY_CONJ: Conj = ['', '', '', '', '', ''];

interface Props {
  editing?: Verb | null;
  onDone: () => void;
}

export default function VerbFormScreen({ editing, onDone }: Props) {
  const { state, addVerb, updateVerb } = useStore();
  const [infinitive, setInfinitive] = useState(editing?.infinitive ?? '');
  const [it, setIt] = useState(editing?.it ?? '');
  const [chapter, setChapter] = useState(editing?.chapter ?? '');
  // Which tenses are shown (and quizzed). "Présent" is preselected for new verbs.
  const [activeTenses, setActiveTenses] = useState<TenseId[]>(
    editing ? TENSES.filter((t) => editing.tenses[t.id]).map((t) => t.id) : ['present'],
  );
  // The six forms for every tense (tenses not selected yet are kept empty).
  const [forms, setForms] = useState<Record<TenseId, Conj>>(() => {
    const init = {} as Record<TenseId, Conj>;
    for (const t of TENSES) init[t.id] = editing?.tenses[t.id] ? ([...editing.tenses[t.id]!] as Conj) : [...EMPTY_CONJ];
    return init;
  });
  const chapters = state ? allChapters(state) : [];

  const valid = infinitive.trim() && it.trim() && activeTenses.length > 0;

  function toggleTense(id: TenseId) {
    setActiveTenses((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function setForm(tense: TenseId, person: number, value: string) {
    setForms((prev) => {
      const conj = [...prev[tense]] as Conj;
      conj[person] = value;
      return { ...prev, [tense]: conj };
    });
  }

  function save() {
    if (!valid) return;
    // Keep only the selected tenses that actually contain at least one form.
    const tenses: Verb['tenses'] = {};
    for (const t of activeTenses) {
      if (forms[t].some((f) => f.trim())) tenses[t] = forms[t].map((f) => f.trim()) as Conj;
    }
    const payload = { infinitive: infinitive.trim(), it: it.trim(), chapter: chapter.trim(), tenses };
    if (editing) updateVerb(editing.id, payload);
    else addVerb(payload);
    onDone();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader>
          <CardTitle className="text-2xl">{editing ? 'Modifica verbo' : 'Aggiungi un verbo'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-inf">Infinito (francese)</Label>
              <Input id="v-inf" value={infinitive} onChange={(e) => setInfinitive(e.target.value)} placeholder="parler" autoFocus autoCapitalize="off" autoCorrect="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-it">Traduzione (italiano)</Label>
              <Input id="v-it" value={it} onChange={(e) => setIt(e.target.value)} placeholder="parlare" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-ch">Capitolo / lezione (facoltativo)</Label>
              <Input id="v-ch" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Capitolo 4" list="chapters" />
              <datalist id="chapters">
                {chapters.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <AccentBar />

          <div className="space-y-2">
            <Label>Tempi verbali da esercitare</Label>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {TENSES.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={activeTenses.includes(t.id)} onCheckedChange={() => toggleTense(t.id)} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* One six-field grid per selected tense */}
          {activeTenses.map((tenseId) => {
            const t = TENSES.find((x) => x.id === tenseId)!;
            return (
              <div key={tenseId} className="rounded-t-sm border-2 border-tropical-charcoal/15 bg-secondary/40 p-4">
                <p className="mb-3 text-sm font-semibold">{t.label}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PERSONS.map((p, i) => (
                    <div key={p} className="space-y-1">
                      <Label className="font-mono text-xs text-muted-foreground">{p}</Label>
                      <Input
                        value={forms[tenseId][i]}
                        onChange={(e) => setForm(tenseId, i, e.target.value)}
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="bg-card"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 pt-1">
            <Button onClick={save} variant="cta" disabled={!valid} className="flex-1">
              <Save className="mr-1 h-4 w-4" /> {editing ? 'Salva modifiche' : 'Aggiungi verbo'}
            </Button>
            <Button variant="outline" onClick={onDone}>
              Annulla
            </Button>
          </div>
          <p className="font-accent text-xs text-muted-foreground">
            Per il passé composé scrivi la forma intera, ad es. «suis allé / allée». Quando rispondi
            al quiz il pronome è facoltativo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
