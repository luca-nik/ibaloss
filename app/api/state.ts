/**
 * api/state.ts — The cloud snapshot endpoint (Vercel serverless function).
 *
 * The whole app state (words, verbs, progress, settings) is one small JSON
 * object, and only one device ever writes it. So instead of a real database
 * we keep ONE JSON snapshot in a Vercel Blob store:
 *
 *   PUT /api/state   → save the snapshot (overwrites the previous one)
 *   GET /api/state   → download the snapshot (404 if none was ever saved)
 *
 * Both require the shared passphrase as `Authorization: Bearer <passphrase>`.
 * The passphrase lives only in the SYNC_SECRET environment variable on Vercel
 * and on the user's phone — it is never part of the code or the repo.
 *
 * This file runs on Vercel, not in the browser. Vite/tsc ignore it (it is
 * outside src/), so it declares its own minimal request/response types
 * instead of depending on @vercel/node.
 */
import { head, put } from '@vercel/blob';

/** Where the snapshot lives inside the Blob store. One file, overwritten. */
const PATHNAME = 'ibaloss/state.json';

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}
interface Res {
  status: (code: number) => { json: (body: unknown) => void };
}

function authorized(req: Req): boolean {
  const secret = process.env.SYNC_SECRET;
  return !!secret && req.headers.authorization === `Bearer ${secret}`;
}

export default async function handler(req: Req, res: Res) {
  if (!process.env.SYNC_SECRET) return res.status(503).json({ error: 'Sync not configured on the server.' });
  if (!authorized(req)) return res.status(401).json({ error: 'Wrong or missing passphrase.' });

  if (req.method === 'PUT') {
    // Body: { updatedAt: number, state: AppState } — stored verbatim.
    await put(PATHNAME, JSON.stringify(req.body), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    try {
      const meta = await head(PATHNAME);
      // The blob URL never changes, so bust the CDN cache explicitly.
      const r = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`blob fetch failed: ${r.status}`);
      return res.status(200).json(await r.json());
    } catch {
      return res.status(404).json({ error: 'No snapshot saved yet.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
