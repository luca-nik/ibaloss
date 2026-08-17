/**
 * SettingsScreen.tsx — The few knobs the app has.
 *
 * 1. How many NEW cards a daily session may introduce (reviews are never
 *    capped — they always all show up).
 * 2. Backup: export everything to a JSON file, or restore from one. This
 *    matters because the data lives only on this device (see kv.ts).
 * 3. Danger zone: erase everything and start over.
 */
import { useRef, useState } from 'react';
import { Brain, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/state/StoreContext';

interface Props {
  onOpenHowItWorks: () => void;
}

export default function SettingsScreen({ onOpenHowItWorks }: Props) {
  const { state, setNewPerDay, setSessionCap, exportBackup, importBackup, resetAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  if (!state) return null;

  /** Download the whole vocabulary as a JSON file. */
  function downloadBackup() {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ibaloss-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Read a backup file chosen by the user and restore it. */
  async function onImportFile(file: File) {
    const ok = importBackup(await file.text());
    setMessage(ok ? 'Backup importato correttamente.' : 'File non valido: importazione annullata.');
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <h2 className="mb-2 text-3xl font-bold">Impostazioni</h2>

      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader>
          <CardTitle className="text-lg">Sessione quotidiana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-cap">Carte per sessione</Label>
            <Input
              id="session-cap"
              type="number"
              min={5}
              max={200}
              value={state.settings.sessionCap}
              onChange={(e) => setSessionCap(Number(e.target.value) || 30)}
              className="w-28"
            />
            <p className="font-accent text-xs text-muted-foreground">
              Prima vengono le carte in scadenza (le più urgenti e quelle che sbagli di più), poi
              le nuove. Se restano carte in attesa, alla fine puoi continuare a giocare.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-per-day">Nuove carte al giorno</Label>
            <Input
              id="new-per-day"
              type="number"
              min={1}
              max={100}
              value={state.settings.newPerDay}
              onChange={(e) => setNewPerDay(Number(e.target.value) || 1)}
              className="w-28"
            />
            <p className="font-accent text-xs text-muted-foreground">
              Quante carte mai viste prima possono entrare in una sessione.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader>
          <CardTitle className="text-lg">L'algoritmo di ripasso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-accent text-sm text-muted-foreground">
            Vuoi sapere come decide iBaloss quando farti rivedere una carta? Te lo spiega in parole
            semplici.
          </p>
          <Button variant="outline" onClick={onOpenHowItWorks}>
            <Brain className="mr-1 h-4 w-4" /> Come funziona
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader>
          <CardTitle className="text-lg">Backup dei dati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-accent text-sm text-muted-foreground">
            I tuoi dati sono salvati solo su questo dispositivo. Esporta un backup ogni tanto per
            non perderli, o per spostarli su un altro dispositivo.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadBackup}>
              <Download className="mr-1 h-4 w-4" /> Esporta JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> Importa JSON
            </Button>
            {/* Invisible file picker, opened by the button above */}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = '';
              }}
            />
          </div>
          {message && <p className="text-sm font-semibold text-primary">{message}</p>}
        </CardContent>
      </Card>

      <Card className="border-2 border-destructive/40">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Zona pericolosa</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              if (
                window.confirm(
                  'Eliminare TUTTE le parole, i verbi e i progressi? Questa azione non si può annullare.',
                )
              )
                resetAll();
            }}
          >
            Cancella tutti i dati
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
