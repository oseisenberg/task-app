# Task App — Implementation Progress

> Local-first PWA. The single source of truth for tasks is a local file the
> AI (Claude cowork) can read and edit; the app parses on load and writes on
> change. Round-trip editing needs no special integration — only an
> AI-readable file format with export + import.

## Core design principle

**Duration is the fundamental unit, not start/end dates.** Every task has a
duration anchored to *either* its start date *or* its end date. Defaults
(start = today, duration = 1 month) mean the only decision is usually the
duration — often nothing at all. A soft deadline is implied by the duration;
an *explicitly set* end date is what makes a deadline "hard". Priority is
separate from deadline. Reminders are positioned relative to the duration.

## Decisions / open questions

- [ ] **File format**: Markdown + per-task YAML frontmatter (most AI-editable)
      vs single JSON file — _pending user decision_
- [x] **Habit app**: purely a *conceptual* distinction — no separate/external
      app to interoperate with. The habit/task rule is documentation only.
      "Move to today" lives **in this app**, on recurring tasks (sets
      `startDate` = today).
- [ ] **Cleanup mode**: exact behavior unspecified (assumed: bulk triage of
      stale / overdue tasks) — _pending_
- [x] Platform: PWA (web app)
- [x] Storage: local-first, file-backed

## Data model checklist

- [ ] `id`, `title`, `description`, `subtasks[]` (`{id,title,description,done}`)
- [ ] Kind: `recurring` vs `oneoff` (same app, separate + combined views)
- [ ] `startDate` (default today)
- [ ] `durationLength` (default from settings, ~1 month)
- [ ] `durationAnchor`: `start` | `end`
- [ ] `explicitEndDate` (nullable) — if set ⇒ hard deadline
- [ ] "set duration so start date = today" helper
- [ ] `noDuration` flag (supported, never default)
- [ ] `priority` (independent of deadline)
- [ ] `frequency` (distinct from duration; default = relative to completion)
- [ ] `reminders[]`: anchor (start/end/evenly-spaced×N), offset (before/after
      allowed), time granularity (timeOfDay vs explicit hour)
- [ ] `progressMadeUntil`, `snoozedUntil`, `active`, `archived`,
      `completionHistory[]`
- [ ] `tags` / `category` for focus filters
- [ ] `confirmOnComplete` flag

## Phase tracker

- [ ] **Phase 0 — Scaffold**: Vite + React + TS PWA (manifest, service
      worker); file-backed store abstraction
- [ ] **Phase 1 — Duration engine + file format + settings**: duration/anchor
      math, soft-vs-hard derivation, no-duration exception, default
      duration/start settings, canonical file format chosen
- [ ] **Phase 2 — Task CRUD + edit menu**: one-off/recurring, recurrence
      (default after completion), subtasks, priority, explicit-end toggle,
      "set duration so start = today", "move to today" button
- [ ] **Phase 3 — Focus mode**: default scoring (priority + deadline urgency;
      steeper for hard deadline), low-priority mix-in, combinable custom
      filters, "load more" only when all focus tasks done
- [ ] **Phase 4 — Snooze split-button**: primary = snooze by task duration;
      caret dropdown = standard periods → custom; off-duration snooze resets
      duration; "snooze to next by duration" button
- [ ] **Phase 5 — Completion flow**: completing requires end date;
      "made progress" hides ~1 week (respects deadline); confirmOnComplete
      shows description on subtask completion; subtasks never pre-checked in
      menu; recurring roll-forward off completion date
- [ ] **Phase 6 — Reminders/notifications**: duration-relative engine
      (evenly-spaced, start/end-anchored, before/after); Web Push + local
      notifications for focus-mode tasks only; time-of-day vs specific-hour;
      validate birthday & glasses use cases
- [ ] **Phase 7 — Navigation & views**: exactly three tabs (Focus, Cleanup,
      Search); no "all tasks" tab; archived habits in own section below the
      inactive section
- [ ] **Phase 8 — Import/Export polish**: manual re-import + change detection
      for Claude-cowork round-trip; conflict handling; file-format doc
- [ ] **Phase 9 — Habit-vs-Task guidance**: document the deciding rule as
      conceptual guidance only (must-be-done-that-day → belongs in a habit
      tracker; multi-day window, no penalty → this Task app, e.g.
      journaling/music vs exercise). No external integration.

## Notes / log

- 2026-05-17: Plan created. Repo was empty (greenfield).
- 2026-05-17: Resolved — habit/task split is conceptual only, no external
  app. Still awaiting decisions on file format and cleanup-mode behavior
  before Phase 0.
