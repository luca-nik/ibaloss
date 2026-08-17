# iBaloss 🇫🇷

App personale per imparare le lingue con le flashcard: vocabolario bidirezionale
e coniugazioni dei verbi, con ripetizione dilazionata (algoritmo SM-2 semplificato).
PWA installabile su Android, funziona offline.

L'app è pubblicata su Vercel: **https://ibaloss.vercel.app** — aprila da Chrome
sul telefono e scegli «Aggiungi a schermata Home» per installarla.

## Sincronizzazione cloud

I dati vivono sul dispositivo (IndexedDB) e l'app funziona anche senza rete.
In più, ogni modifica viene copiata automaticamente come un unico *snapshot*
JSON in un Vercel Blob store, attraverso la funzione serverless `api/state.ts`:

- `PUT /api/state` salva lo snapshot, `GET /api/state` lo scarica; entrambe
  richiedono `Authorization: Bearer <SYNC_SECRET>` (variabile d'ambiente su Vercel).
- Sul telefono: Opzioni → «Sincronizzazione cloud» → inserisci la passphrase →
  «Attiva sincronizzazione». Da quel momento ogni salvataggio viene inviato
  (debounced), e all'avvio l'app adotta lo snapshot remoto se è più recente.
- Un solo dispositivo scrive (il telefono), quindi «il più recente vince» non
  può generare conflitti.

## Comandi

```bash
npm install     # prima volta: scarica le dipendenze
npm run dev     # sviluppo: app su http://localhost:3000, si ricarica a ogni modifica
npm run build   # produce la versione finale nella cartella dist/
```

## Deploy

Il progetto Vercel è collegato a questa cartella (`.vercel/`). Per pubblicare:

```bash
vercel deploy --prod
```

Variabili d'ambiente configurate su Vercel: `SYNC_SECRET` (la passphrase di
sincronizzazione) e `BLOB_READ_WRITE_TOKEN` (creata automaticamente collegando
il Blob store `ibaloss-sync` al progetto).

## Da dove partire per le modifiche

| Vuoi cambiare…                    | File                                   |
| --------------------------------- | -------------------------------------- |
| L'algoritmo di ripasso            | `src/core/scheduler.sm2.ts`            |
| Quante/quali carte al giorno      | `src/core/session.ts`                  |
| Testi e schermate                 | `src/screens/`                         |
| Colori, font, stile               | `src/index.css` e `tailwind.config.js` |
| Lingue supportate                 | `LANGUAGES` in `src/core/types.ts`     |
| La sincronizzazione cloud         | `src/data/remote.ts` e `api/state.ts`  |

Ogni file ha un commento in cima che spiega cosa fa, in linguaggio semplice.
