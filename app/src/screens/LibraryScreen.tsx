/**
 * LibraryScreen.tsx — Everything you've saved, in one place.
 *
 * Two tabs (words / verbs), a search box and a chapter filter. Each row
 * shows when the card is next due, and lets you edit or delete it.
 * "Editing" means: this screen tells App.tsx which item to open in the
 * corresponding form screen.
 */
import { useState } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/state/StoreContext';
import { allChapters, dueLabel, tenseLabel, verbTenseIds } from '@/core/session';
import type { Verb, Word } from '@/core/types';

interface Props {
  onEditWord: (w: Word) => void;
  onEditVerb: (v: Verb) => void;
}

export default function LibraryScreen({ onEditWord, onEditVerb }: Props) {
  const { state, deleteWord, deleteVerb } = useStore();
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState<string>('all');

  if (!state) return null;
  const lang = state.settings.lang;
  const chapters = allChapters(state);
  const q = query.trim().toLowerCase();

  // Apply language, search text + chapter filter to both lists.
  const words = state.words.filter(
    (w) =>
      w.lang === lang &&
      (chapter === 'all' || w.chapter === chapter) &&
      (!q || w.it.toLowerCase().includes(q) || w.fr.toLowerCase().includes(q)),
  );
  const verbs = state.verbs.filter(
    (v) =>
      v.lang === lang &&
      (chapter === 'all' || v.chapter === chapter) &&
      (!q || v.infinitive.toLowerCase().includes(q) || v.it.toLowerCase().includes(q)),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="mb-4 text-3xl font-bold">Libreria</h2>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca…" className="pl-9" />
        </div>
        <Select value={chapter} onValueChange={setChapter}>
          <SelectTrigger className="w-44 rounded-t-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i capitoli</SelectItem>
            {chapters.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="words">
        <TabsList className="mb-4 rounded-t-sm">
          <TabsTrigger value="words" className="rounded-t-sm">Parole ({words.length})</TabsTrigger>
          <TabsTrigger value="verbs" className="rounded-t-sm">Verbi ({verbs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="words" className="space-y-2">
          {words.length === 0 && <p className="py-8 text-center text-muted-foreground">Nessuna parola trovata.</p>}
          {words.map((w) => (
            <Card key={w.id} className="border-2 border-tropical-charcoal/10">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {w.it} <span className="text-tropical-orange">↔</span> {w.fr}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {w.chapter && <Badge variant="secondary">{w.chapter}</Badge>}
                    <Badge variant="outline" className="font-mono text-[11px]">
                      IT→FR: {dueLabel(w.progress['it-fr'])}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      FR→IT: {dueLabel(w.progress['fr-it'])}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onEditWord(w)} aria-label="Modifica">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(`Eliminare «${w.it} ↔ ${w.fr}»?`)) deleteWord(w.id);
                  }}
                  aria-label="Elimina"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="verbs" className="space-y-2">
          {verbs.length === 0 && <p className="py-8 text-center text-muted-foreground">Nessun verbo trovato.</p>}
          {verbs.map((v) => (
            <Card key={v.id} className="border-2 border-tropical-charcoal/10">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {v.infinitive} <span className="font-accent font-normal text-muted-foreground">({v.it})</span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {v.chapter && <Badge variant="secondary">{v.chapter}</Badge>}
                    {verbTenseIds(v).map((t) => (
                      <Badge key={t} variant="outline" className="text-[11px]">
                        {tenseLabel(t)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onEditVerb(v)} aria-label="Modifica">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(`Eliminare il verbo «${v.infinitive}»?`)) deleteVerb(v.id);
                  }}
                  aria-label="Elimina"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
