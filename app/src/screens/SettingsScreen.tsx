/**
 * SettingsScreen.tsx — The few knobs the app has.
 *
 * 1. How many NEW cards a daily session may introduce (reviews are never
 *    capped — they always all show up).
 * 2. A plain-words explanation of the review algorithm.
 * 3. Cloud sync: the passphrase that mirrors every change to the server
 *    (that is also the backup — no manual export needed anymore).
 */
import { useState } from 'react';
import { Brain, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/state/StoreContext';
import { getPassphrase, pushSnapshotNow, setPassphrase } from '@/data/remote';

interface Props {
  onOpenHowItWorks: () => void;
}

export default function SettingsScreen({ onOpenHowItWorks }: Props) {
  const { state, setNewPerDay, setSessionCap } = useStore();
  const [passphrase, setLocalPassphrase] = useState(getPassphrase());
  const [syncMessage, setSyncMessage] = useState('');

  if (!state) return null;

  /** Save the passphrase and immediately push a snapshot, to prove it works. */
  async function activateSync() {
    setPassphrase(passphrase.trim());
    setSyncMessage('Sincronizzazione in corso…');
    if (!state) return;
    const ok = await pushSnapshotNow(state);
    setSyncMessage(
      ok
        ? 'Sincronizzazione attiva: i tuoi dati sono ora anche nel cloud.'
        : 'Non riesco a contattare il server. Controlla la passphrase e la connessione.',
    );
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
          <CardTitle className="text-lg">Sincronizzazione cloud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-accent text-sm text-muted-foreground">
            Con la passphrase del tuo server, ogni modifica viene copiata automaticamente nel cloud
            e ripristinata su un nuovo dispositivo. L'app continua a funzionare offline.
          </p>
          <div className="space-y-2">
            <Label htmlFor="sync-passphrase">Passphrase</Label>
            <Input
              id="sync-passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setLocalPassphrase(e.target.value)}
              placeholder="La passphrase del server"
            />
          </div>
          <Button variant="outline" onClick={() => void activateSync()} disabled={!passphrase.trim()}>
            <CloudUpload className="mr-1 h-4 w-4" /> Attiva sincronizzazione
          </Button>
          {syncMessage && <p className="text-sm font-semibold text-primary">{syncMessage}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
