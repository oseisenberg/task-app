// Focus mode selection.
//
// Default behavior: pick a small number of tasks/day, scored by priority and
// deadline urgency. Urgency rises as the window closes; the curve is STEEPER
// for a hard deadline (explicit end date) and gentler for a soft one (a
// duration-implied deadline). A few low-priority tasks are intentionally
// mixed in so they still get done — fewer of them, weighted by priority.
//
// The user can also apply combinable custom filters (tags / priority / kind)
// on the same view. "Load more" is only offered when everything is done.

import { resolveWindow, todayISO } from "./duration";
import type { AppData, Task } from "./types";

export interface FocusFilters {
  tags: string[]; // task must include ALL of these (combinable)
  kinds: Task["kind"][]; // empty = any
  minPriority: number; // 1 = no floor
}

export const NO_FILTERS: FocusFilters = {
  tags: [],
  kinds: [],
  minPriority: 1,
};

export function isAvailable(t: Task, today: string): boolean {
  return (
    t.active &&
    !t.archived &&
    (!t.snoozedUntil || t.snoozedUntil <= today) &&
    (!t.progressMadeUntil || t.progressMadeUntil <= today)
  );
}

function passesFilters(t: Task, f: FocusFilters): boolean {
  if (t.priority < f.minPriority) return false;
  if (f.kinds.length && !f.kinds.includes(t.kind)) return false;
  if (f.tags.length && !f.tags.every((tag) => t.tags.includes(tag)))
    return false;
  return true;
}

/**
 * Higher = more deserving of focus today. Combines priority with deadline
 * urgency. Hard deadlines ramp up far more aggressively as they approach.
 */
export function score(t: Task, today: string): number {
  const priorityScore = t.priority * 10; // 10..50

  const w = resolveWindow(t);
  if (!w) return priorityScore; // no-duration: priority only

  const daysLeft = Math.max(
    0,
    Math.round(
      (new Date(w.end).getTime() - new Date(today).getTime()) / 86_400_000
    )
  );

  // Urgency decays with days remaining; hard deadlines decay slower (stay
  // urgent longer) and overdue work is pushed hard.
  const overdue = daysLeft === 0;
  const k = w.hardDeadline ? 21 : 7; // characteristic horizon in days
  const base = w.hardDeadline ? 60 : 25;
  const urgency = overdue ? base * 2 : base * (k / (k + daysLeft));

  return priorityScore + urgency;
}

/**
 * Select the focus set. Returns the top `target` by score, but reserves a
 * small slot or two for lower-priority tasks so they don't rot — chosen by
 * score among the non-top remainder.
 */
export function selectFocus(
  data: AppData,
  filters: FocusFilters = NO_FILTERS,
  target = data.settings.focusTargetCount,
  today: string = todayISO()
): Task[] {
  const pool = data.tasks
    .filter((t) => isAvailable(t, today) && passesFilters(t, filters))
    .map((t) => ({ t, s: score(t, today) }))
    .sort((a, b) => b.s - a.s);

  if (pool.length <= target) return pool.map((x) => x.t);

  const lowSlots = Math.max(1, Math.floor(target / 5));
  const topCount = target - lowSlots;

  const top = pool.slice(0, topCount);
  // Lower-priority mix-in: best-scoring among the lowest-priority remainder.
  const remainder = pool.slice(topCount);
  const minPri = Math.min(...remainder.map((x) => x.t.priority));
  const lows = remainder
    .filter((x) => x.t.priority === minPri)
    .slice(0, lowSlots);
  const fillers = remainder
    .filter((x) => !lows.includes(x))
    .slice(0, lowSlots - lows.length);

  return [...top, ...lows, ...fillers].map((x) => x.t);
}

/** All tasks available today that are NOT in the current focus set. */
export function overflowCount(
  data: AppData,
  filters: FocusFilters,
  shown: Task[],
  today: string = todayISO()
): number {
  const shownIds = new Set(shown.map((t) => t.id));
  return data.tasks.filter(
    (t) =>
      isAvailable(t, today) &&
      passesFilters(t, filters) &&
      !shownIds.has(t.id)
  ).length;
}
