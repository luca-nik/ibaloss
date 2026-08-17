/**
 * WordFormScreen.tsx — Adding or editing one vocabulary word.
 *
 * A word is just an Italian ↔ French pair, plus an optional free note
 * (e.g. gender). The form is kept minimal: the accented-characters bar and
 * the note field stay hidden behind small toggle buttons and appear only
 * when you ask for them. The same form is used for creating and for
 * editing: when `editing` is passed, the fields start pre-filled (and the
 * note, if present, starts visible).
 */
import { useState } from 'react';
import { Save, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AccentBar from '@/components/AccentBar';
import { useStore } from '@/state/StoreContext';
import type { Word } from '@/core/types';

interface Props {
  /** When set, the form edits this word instead of creating a new one. */
  editing?: Word | null;
  /** Called after a save or a cancel, so the parent can leave the form. */
  onDone: () => void;
}

export default function WordFormScreen({ editing, onDone }: Props) {
  const { addWord, updateWord } = useStore();
  const [it, setIt] = useState(editing?.it ?? '');
  const [fr, setFr] = useState(editing?.fr ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  // Hidden extras: opened on demand (the note starts open if there is one).
  const [showAccents, setShowAccents] = useState(false);
  const [showNote, setShowNote] = useState(!!editing?.note);

  const valid = it.trim() && fr.trim();

  function save() {
    if (!valid) return;
    // The chapter field no longer exists in the form; existing words keep theirs.
    const payload = {
      it: it.trim(),
      fr: fr.trim(),
      chapter: editing?.chapter ?? '',
      note: showNote ? note.trim() || undefined : undefined,
    };
    if (editing) updateWord(editing.id, payload);
    else addWord(payload);
    onDone();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader>
          <CardTitle className="text-2xl">{editing ? 'Modifica parola' : 'Aggiungi una parola'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="w-it">Italiano</Label>
                <Input id="w-it" value={it} onChange={(e) => setIt(e.target.value)} placeholder="casa" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-fr">Francese</Label>
                <Input id="w-fr" value={fr} onChange={(e) => setFr(e.target.value)} placeholder="maison" autoCapitalize="off" autoCorrect="off" />
              </div>
            </div>

            {/* Hidden extras: tap to reveal */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowAccents((v) => !v)}
              >
                <span className="mr-1 font-semibold">à ç é</span> caratteri speciali
              </Button>
              {!showNote && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setShowNote(true)}
                >
                  <StickyNote className="mr-1 h-4 w-4" /> nota
                </Button>
              )}
            </div>

            {showAccents && <AccentBar />}

            {showNote && (
              <div className="space-y-1.5">
                <Label htmlFor="w-note">Nota (facoltativa)</Label>
                <Input id="w-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. femminile" />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="cta" disabled={!valid} className="flex-1">
                <Save className="mr-1 h-4 w-4" /> {editing ? 'Salva modifiche' : 'Aggiungi'}
              </Button>
              <Button type="button" variant="outline" onClick={onDone}>
                Annulla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
