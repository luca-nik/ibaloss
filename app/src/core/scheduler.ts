/**
 * scheduler.ts — The algorithm CONTRACT, and the single swap point.
 *
 * The rest of the app never contains scheduling logic. It only talks to the
 * `Scheduler` interface below: "here is how the user did, tell me when to
 * show this card again".
 *
 * ═══════════════════════════════════════════════════════════════════
 *  WANT TO CHANGE THE ALGORITHM?
 *  1. Copy scheduler.sm2.ts to a new file (e.g. scheduler.fsrs.ts) and
 *     rewrite the two functions however you like.
 *  2. Change the ONE import line below to point at your new file.
 *  Nothing else in the app needs to change.
 * ═══════════════════════════════════════════════════════════════════
 */
import type { CardProgress, Grade } from './types';
import { sm2Scheduler } from './scheduler.sm2';

export interface Scheduler {
  /** A fresh progress record for a card the user has never seen. */
  initial(): CardProgress;
  /**
   * Given the current progress of a card and how the user just did,
   * compute the new progress (next due date, new interval, new ease).
   */
  grade(progress: CardProgress, grade: Grade): CardProgress;
}

/** The algorithm the app actually uses — this is the one-line swap point. */
export const scheduler: Scheduler = sm2Scheduler;
