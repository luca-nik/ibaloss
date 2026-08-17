/**
 * kv.ts — The tiny key-value database.
 *
 * The app's data lives in IndexedDB, a small database built into every
 * browser (including Chrome on Android). IndexedDB's raw API is awkward,
 * so we use the tiny library "idb-keyval" which turns it into three
 * simple operations: save a value under a key, read it back, delete it.
 *
 * This file is the ONLY place that touches idb-keyval. If we ever want
 * to move the data somewhere else (e.g. a cloud database), we rewrite
 * this file and repository.ts — the rest of the app won't notice.
 */
import { get, set, del } from 'idb-keyval';

/** Read the value stored under `key` (undefined if nothing was ever saved). */
export async function kvGet<T>(key: string): Promise<T | undefined> {
  return get(key);
}

/** Save `value` under `key`, replacing whatever was there. */
export async function kvSet(key: string, value: unknown): Promise<void> {
  await set(key, value);
}

/** Remove a key entirely. */
export async function kvDel(key: string): Promise<void> {
  await del(key);
}
