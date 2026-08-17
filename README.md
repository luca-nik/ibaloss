# iBaloss 🇫🇷

Personal language-learning flashcard app (Italian UI, teaching French):
bidirectional vocabulary and verb conjugations with spaced repetition
(simplified SM-2). Offline-first PWA, installable on Android, with cloud
snapshot sync.

- **Live app:** https://ibaloss.vercel.app
- **Code & docs:** [`app/`](app/) — see [`app/README.md`](app/README.md)

## Stack

Vite + React 19 + TypeScript + Tailwind/shadcn-ui. Data lives on-device
(IndexedDB via idb-keyval); a Vercel serverless function (`app/api/state.ts`)
mirrors the whole state as a single JSON snapshot in a Vercel Blob store,
protected by a shared passphrase.

## Quick start

```bash
cd app
npm install
npm run dev        # http://localhost:3000
vercel deploy --prod   # publish
```
