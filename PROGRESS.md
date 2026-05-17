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

- [x] **File format**: single **JSON** file (for now). Canonical store the
      AI reads/edits directly; revisit Markdown later if needed.
- [x] **Habit app**: purely a *conceptual* distinction — no separate/external
      app to interoperate with. The habit/task rule is documentation only.
      "Move to today" lives **in this app**, on recurring tasks (sets
      `startDate` = today).
- [x] **Cleanup mode**: dropped for now. Tabs are **Focus** and **Search**
      only.
- [x] Platform: PWA (web app)
- [x] Storage: local-first, file-backed

## Data model checklist

- [x] `id`, `title`, `description`, `subtasks[]` (`{id,title,description,done}`)
- [x] Kind: `recurring` vs `oneoff` (same app, separate + combined views)
- [x] `startDate` (default today)
- [x] `duration` (default from settings, ~1 month)
- [x] `durationAnchor`: `start` | `end`
- [x] `explicitEndDate` (nullable) — if set ⇒ hard deadline
- [x] "set duration so start date = today" helper (`durationSoStartIsToday`)
- [x] `noDuration` flag (supported, never default)
- [x] `priority` (independent of deadline)
- [x] `recurrence` (distinct from duration; default basis = completion)
- [x] `reminders[]`: anchor (start/end/evenly-spaced×N), offset (before/after
      allowed), time granularity (timeOfDay vs explicit hour) — _type only;
      scheduling engine is Phase 6_
- [x] `progressMadeUntil`, `snoozedUntil`, `active`, `archived`,
      `completionHistory[]`
- [x] `tags` for focus filters
- [x] `confirmOnComplete` flag

## Phase tracker

- [x] **Phase 0 — Scaffold**: Vite + React + TS PWA (manifest, SW,
      offline shell); JSON store abstraction; two-tab shell; build +
      typecheck + tests green
- [x] **Phase 1 — Duration engine + file format + settings**: duration/anchor
      math, soft-vs-hard derivation, no-duration exception, default
      duration/start settings; JSON schema + parse/serialize/normalize;
      8 unit tests for the duration engine
- [x] **Phase 2 — Task CRUD + edit menu**: pure mutations (upsert/delete/
      patch/moveToToday/completeTask) + 4 tests; TaskEditor modal with
      kind, duration/anchor/start, noDuration, explicit-end (hard) toggle,
      "duration so start = today", priority, tags, subtasks,
      confirmOnComplete, "move to today"; complete from focus; edit from
      both views
- [x] **Phase 3 — Focus mode**: scoring (priority + deadline urgency,
      steeper/longer-horizon for hard deadlines, overdue boost),
      low-priority mix-in, sticky daily snapshot, combinable filters
      (tags AND / recurring-only / important-only / clear), "load more"
      only once the set is cleared; 6 tests
- [x] **Phase 4 — Snooze split-button**: snoozeByDuration (primary, leaves
      duration unchanged) / snoozeByNewDuration (resets duration) /
      snoozeUntil (date → day-duration); SnoozeButton split control with
      caret menu (by duration → 1wk/1mo → custom date); wired into Focus;
      3 tests
- [x] **Phase 5 — Completion flow**: CompletionDialog requires an end date
      (default today); markProgress hides ~1wk but clamps to a hard
      deadline; confirmOnComplete shows description on task + subtasks;
      subtasks shown unchecked in the dialog; recurring roll-forward (P2);
      4 new tests
- [x] **Phase 6 — Reminders/notifications**: duration-relative engine
      (start/end offset incl. negative/after, evenly-spaced×N),
      time-of-day→hour with explicit-hour override; nextReminder/
      dueReminders; useReminders fires local notifications for the default
      focus set only; reminder editor UI; birthday & glasses cases tested;
      6 tests _(Web Push when-closed needs a server — out of scope)_
- [ ] **Phase 7 — Navigation & views**: two tabs (Focus, Search); no "all
      tasks" tab; no cleanup mode for now; archived habits in own section
      below the inactive section
- [ ] **Phase 8 — Import/Export polish**: manual re-import + change detection
      for Claude-cowork round-trip; conflict handling; file-format doc
- [ ] **Phase 9 — Habit-vs-Task guidance**: document the deciding rule as
      conceptual guidance only (must-be-done-that-day → belongs in a habit
      tracker; multi-day window, no penalty → this Task app, e.g.
      journaling/music vs exercise). No external integration.

## Notes / log

- 2026-05-17: Plan created. Repo was empty (greenfield).
- 2026-05-17: Resolved — habit/task split is conceptual only, no external
  app.
- 2026-05-17: Resolved — file format is single JSON file for now.
- 2026-05-17: Resolved — no cleanup mode for now; tabs are Focus + Search.
- 2026-05-17: Phase 0 + 1 done. PWA scaffold (Vite/React/TS, manifest, SW),
  duration engine + 8 passing tests, JSON store (load/save/serialize/
  deserialize/normalize), settings defaults, task factory, two-tab shell
  with add/list/search/import/export. typecheck + tests + prod build green.
- 2026-05-17: Phase 2 done. Pure mutations module + tests, full TaskEditor
  modal wired into Focus + Search, complete action rolls recurring forward
  from completion date. 12 tests green; typecheck + prod build green.
- 2026-05-17: Phase 3 done. focus.ts scoring/selection with hard-deadline
  urgency, low-priority mix-in, combinable filters; sticky snapshot +
  load-more in FocusView. 18 tests green; typecheck + prod build green.
- 2026-05-17: Phase 4 done. Snooze mutations (by-duration / new-duration /
  until-date) + split-button control wired into Focus. 21 tests green;
  typecheck + prod build green.
- 2026-05-17: Phase 5 done. markProgress (deadline-clamped) +
  setSubtasksDone + CompletionDialog (required end date, confirm shows
  descriptions, subtasks unchecked); Progress button in Focus. 24 tests
  green; typecheck + prod build green.
- 2026-05-17: Phase 6 done. reminders.ts duration-relative engine + 6
  tests, useReminders hook (focus-set-only local notifications), reminder
  editor UI. 30 tests green; typecheck + prod build green.
  Next: Phase 7 (nav + archive action + recurring/oneoff views).
