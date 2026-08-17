# iBaloss 🇫🇷

App personale per imparare le lingue con le flashcard: vocabolario bidirezionale
e coniugazioni dei verbi, con ripetizione dilazionata (algoritmo SM-2 semplificato).
PWA installabile su Android, funziona offline, dati sul dispositivo.

La **specifica completa** (architettura, modello dati, design system, criteri di
accettazione) è nel documento «Language App — Implementation Plan.md».

## Comandi

```bash
npm install     # prima volta: scarica le dipendenze
npm run dev     # sviluppo: app su http://localhost:3000, si ricarica a ogni modifica
npm run build   # produce la versione finale nella cartella dist/
```

## Da dove partire per le modifiche

| Vuoi cambiare…                    | File                                   |
| --------------------------------- | -------------------------------------- |
| L'algoritmo di ripasso            | `src/core/scheduler.sm2.ts`            |
| Quante/quali carte al giorno      | `src/core/session.ts`                  |
| Testi e schermate                 | `src/screens/`                         |
| Colori, font, stile               | `src/index.css` e `tailwind.config.js` |
| Lingue supportate                 | `LANGUAGES` in `src/core/types.ts`     |

Ogni file ha un commento in cima che spiega cosa fa, in linguaggio semplice.

## Nota sul deploy

L'app pubblicata (quella sul telefono) si aggiorna salvando una nuova versione
dalla piattaforma Kimi: questa repo è per lavorare al codice, non pubblica
automaticamente. `npm run build` produce comunque una `dist/` statica
ospitabile ovunque.
