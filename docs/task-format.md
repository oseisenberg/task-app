# Task file format (for Claude cowork)

The app exports/imports a single JSON file. This is the contract for
editing tasks out-of-band with an AI: **Export** from the app, edit the
JSON, then **Import** (use *merge* to apply only the tasks you changed).

## Top-level shape

```json
{
  "version": 1,
  "settings": {
    "defaultDuration": { "amount": 1, "unit": "month" },
    "defaultDurationAnchor": "start",
    "focusTargetCount": 5
  },
  "tasks": [ /* Task objects */ ]
}
```

## Task object

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable; **keep it** so merge matches by id. |
| `title` | string | |
| `description` | string? | |
| `kind` | `"oneoff"` \| `"recurring"` | |
| `startDate` | `"YYYY-MM-DD"` | Defaults to today on new tasks. |
| `duration` | `{ amount, unit }` | `unit`: `day`/`week`/`month`/`year`. **The primary decision.** |
| `durationAnchor` | `"start"` \| `"end"` | `end` = window measured back from the deadline (e.g. taxes). |
| `explicitEndDate` | `"YYYY-MM-DD"` \| `null` | **Setting this makes the deadline HARD.** `null` = soft (implied by duration). |
| `noDuration` | boolean | The exception; keep `false` normally. |
| `priority` | 1–5 | 5 = highest. Independent of the deadline. |
| `recurrence` | `{ basis, every }` \| `null` | `basis`: `"completion"` (default) or `"scheduled"`. |
| `reminders` | Reminder[] | Relative to the duration — see below. |
| `subtasks` | `{ id, title, description?, done }[]` | |
| `tags` | string[] | Used by focus-mode filters. |
| `progressMadeUntil` | date \| null | Hidden until this date (still respects a hard deadline). |
| `snoozedUntil` | date \| null | |
| `active` / `archived` | boolean | |
| `completionHistory` | date[] | Append-only. |
| `confirmOnComplete` | boolean | Show description on completion + subtasks. |

## Reminder object

Reminders are positioned **relative to the duration**, never absolute:

- `{ "anchor": "start", "offsetDays": -2, "timeOfDay": "morning" }` — 2 days
  before the window starts (negative = before).
- `{ "anchor": "end", "offsetDays": 0, "timeOfDay": "evening" }` — at the
  deadline. Positive `offsetDays` = after (a follow-up).
- `{ "anchor": "evenly-spaced", "count": 3, "timeOfDay": "morning" }` —
  3 reminders spread across the window.

`timeOfDay` is `morning`/`afternoon`/`evening`/`anytime`. Add `"hour": 11`
only when an exact hour matters.

### Examples

Birthday (recurring, 1-day window, nudge before + on the day):

```json
{
  "kind": "recurring",
  "duration": { "amount": 1, "unit": "day" },
  "recurrence": { "basis": "scheduled", "every": { "amount": 1, "unit": "year" } },
  "reminders": [
    { "anchor": "start", "offsetDays": -2, "timeOfDay": "morning" },
    { "anchor": "start", "offsetDays": 0, "timeOfDay": "morning", "hour": 11 }
  ]
}
```

Taxes (important, hard April deadline, long lead time, duration from end):

```json
{
  "priority": 5,
  "durationAnchor": "end",
  "explicitEndDate": "2026-04-15",
  "duration": { "amount": 2, "unit": "month" },
  "reminders": [{ "anchor": "evenly-spaced", "count": 4, "timeOfDay": "morning" }]
}
```
