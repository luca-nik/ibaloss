/**
 * scheduler.sm2.ts — The current scheduling algorithm: "SM-2 lite".
 *
 * This is a simplified version of the classic SM-2 algorithm (the one Anki
 * popularized). The idea in one sentence: cards you fail come back almost
 * immediately, cards you know come back after a gap that grows each time.
 *
 * Everything works in whole days, because the app is meant for one
 * session per day. A card graded "again" during a session is also put
 * back at the end of that same session's queue (that logic lives in
 * QuizScreen, not here).
 */
import type { Scheduler } from './scheduler';
import type { CardProgress, Grade } from './types';
import { todayStr, addDays } from './dates';

/** Never let the growth factor drop below this, or intervals would stagnate. */
const MIN_EASE = 1.3;

export const sm2Scheduler: Scheduler = {
  initial(): CardProgress {
    return { due: todayStr(), interval: 0, ease: 2.5, reps: 0, lapses: 0, state: 'new' };
  },

  grade(p: CardProgress, g: Grade): CardProgress {
    const next: CardProgress = { ...p, reps: p.reps + 1 };

    if (p.state === 'new' || p.state === 'learning') {
      // The card is still being learned: short, fixed steps.
      if (g === 'again') {
        next.interval = 0;
        next.due = todayStr(); // due again right away (re-queued in this session)
        next.state = 'learning';
        next.lapses = p.lapses + 1; // remember the failure: this card needs more attention
      } else if (g === 'good') {
        next.interval = 1;
        next.due = addDays(todayStr(), 1); // see it again tomorrow
        next.state = 'review';
      } else {
        next.interval = 3;
        next.due = addDays(todayStr(), 3);
        next.state = 'review';
        next.ease = p.ease + 0.15;
      }
    } else {
      // The card is in the long-term review cycle: the gap grows (or resets).
      if (g === 'again') {
        next.interval = 1;
        next.due = addDays(todayStr(), 1);
        next.state = 'learning'; // back to the learning pile
        next.ease = Math.max(MIN_EASE, p.ease - 0.2);
        next.lapses = p.lapses + 1;
      } else if (g === 'good') {
        next.interval = Math.max(1, Math.round(p.interval * p.ease));
        next.due = addDays(todayStr(), next.interval);
      } else {
        next.interval = Math.max(p.interval + 2, Math.round(p.interval * p.ease * 1.3));
        next.due = addDays(todayStr(), next.interval);
        next.ease = p.ease + 0.15;
      }
    }
    return next;
  },
};
