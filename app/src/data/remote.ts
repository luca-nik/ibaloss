/**
 * remote.ts — Syncing the whole state to the cloud, as one snapshot.
 *
 * The app works offline-first: IndexedDB (kv.ts) stays the source of truth.
 * On top of that, this file mirrors the state to a cloud snapshot
 * (api/state.ts on Vercel) so the data survives a lost phone and can be
 * picked up by a new one:
 *
 *   - After every local save, the state is pushed (debounced: a quiz
 *     session saves many times in a row, we only send the last one).
 *   - On app start, the cloud snapshot is downloaded; if it is NEWER than
 *     the local data, it replaces it (see StoreContext).
 *
 * There is exactly one writer (your phone), so "newest wins" can never
 * produce a conflict.
 *
 * The passphrase is the only credential: it is typed once in Settings and
 * kept in localStorage on the device. Without a passphrase, sync is simply
 * off and everything behaves as before.
 */
import type { AppState } from '@/core/types';
import { kvGet, kvSet } from './kv';

const PASS_KEY = 'ibaloss-sync-passphrase';
/** kv key holding the timestamp (ms) of the last snapshot we pushed. */
const META_UPDATED_AT = 'sync-updated-at';

export interface Snapshot {
  updatedAt: number;
  state: AppState;
}

export function getPassphrase(): string {
  return localStorage.getItem(PASS_KEY) ?? '';
}

export function setPassphrase(passphrase: string): void {
  localStorage.setItem(PASS_KEY, passphrase);
}

/** Timestamp of the newest local data (as far as the cloud knows). */
export async function localUpdatedAt(): Promise<number> {
  return (await kvGet<number>(META_UPDATED_AT)) ?? 0;
}

/** Send the snapshot now. Returns false when offline or rejected. */
async function putSnapshot(state: AppState): Promise<boolean> {
  const passphrase = getPassphrase();
  if (!passphrase) return false;
  const updatedAt = Date.now();
  try {
    const r = await fetch('/api/state', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${passphrase}` },
      body: JSON.stringify({ updatedAt, state }),
    });
    if (r.ok) await kvSet(META_UPDATED_AT, updatedAt);
    return r.ok;
  } catch {
    return false; // offline: the next save will try again
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Push after every save, but collapse bursts into a single request. */
export function pushSnapshot(state: AppState): void {
  if (!getPassphrase()) return;
  clearTimeout(timer);
  timer = setTimeout(() => void putSnapshot(state), 1500);
}

/** Push immediately (used by the "activate sync" button in Settings). */
export function pushSnapshotNow(state: AppState): Promise<boolean> {
  clearTimeout(timer);
  return putSnapshot(state);
}

/** Download the cloud snapshot. null when sync is off, offline, or empty. */
export async function pullSnapshot(): Promise<Snapshot | null> {
  const passphrase = getPassphrase();
  if (!passphrase) return null;
  try {
    const r = await fetch('/api/state', { headers: { authorization: `Bearer ${passphrase}` } });
    if (!r.ok) return null;
    return (await r.json()) as Snapshot;
  } catch {
    return null;
  }
}
