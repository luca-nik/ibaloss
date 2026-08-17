/**
 * HowItWorksScreen.tsx — The algorithm, explained in plain words.
 *
 * A screen for the curious user: what the app does with your "I knew it /
 * I didn't" answers, without any math jargon. If you ever swap the
 * scheduling algorithm (see core/scheduler.ts), update this text too.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/state/StoreContext';

export default function HowItWorksScreen() {
  const { state } = useStore();
  const cap = state?.settings.sessionCap ?? 30;
  const newPerDay = state?.settings.newPerDay ?? 10;

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <h2 className="mb-2 text-3xl font-bold">Come funziona il ripasso</h2>
      <p className="font-accent text-muted-foreground">
        iBaloss usa una versione semplificata di <strong>SM-2</strong>, l'algoritmo a ripetizione
        dilazionata reso famoso da Anki. Ecco l'idea, senza formule.
      </p>

      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">🧠 L'idea di base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-accent text-sm">
          <p>
            La memoria funziona così: se ripassi una cosa <em>un attimo prima di dimenticarla</em>,
            la ricordi molto più a lungo. L'algoritmo cerca di indovinare quel momento per ogni
            carta.
          </p>
          <p>
            Ogni carta ha il suo <strong>calendario personale</strong>: le due direzioni di una
            parola (italiano→francese e francese→italiano) e ogni tempo di un verbo viaggiano
            separati, perché saperle in un verso non significa saperle nell'altro.
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">🔁 Cosa succede quando rispondi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-accent text-sm">
          <p>
            <strong>Non la sapevo</strong> → la carta torna subito in coda nella stessa sessione, e
            poi di nuovo domani. Il suo "passo" si accorcia: la vedrai più spesso. L'app la conta
            anche tra le tue "nemiche" 😈.
          </p>
          <p>
            <strong>La sapevo</strong> → la rivedrai domani se è nuova; se la conosci già, il
            prossimo ripasso è tra <em>intervallo × ~2,5 giorni</em> (3 giorni, poi una settimana,
            poi due…).
          </p>
          <p>
            <strong>Facile</strong> → l'intervallo cresce ancora più in fretta (× ~3,3): le carte
            che padroneggi smettono presto di disturbarti.
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-tropical-charcoal/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">🃏 Come è composta la sessione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-accent text-sm">
          <p>
            Ogni giorno la sessione contiene al massimo <strong>{cap} carte</strong> (lo puoi
            cambiare nelle Opzioni). Prima le carte in scadenza — dando la precedenza a quelle più
            in ritardo e a quelle che sbagli più spesso — poi, negli spazi rimasti, fino a{' '}
            <strong>{newPerDay} carte nuove</strong>.
          </p>
          <p>
            Se finite le {cap} carte ci sono ancora ripassi in attesa, puoi premere{' '}
            <strong>«Continua a giocare»</strong> per un altro round. Il ripasso di un capitolo,
            invece, non ha limiti: mostra tutto il capitolo, come sfogliare il libro.
          </p>
        </CardContent>
      </Card>

      <p className="text-center font-accent text-xs text-muted-foreground">
        Curiosità tecnica: l'algoritmo vive in un modulo a parte (core/scheduler.sm2.ts). Per
        cambiarlo basta sostituire quel file — il resto dell'app non se ne accorge.
      </p>
    </div>
  );
}
