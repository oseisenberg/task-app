import { useState } from "react";
import type { Task } from "../core/types";

interface Props {
  task: Task;
  /** Snooze by the task's own duration (primary action). */
  onSnoozeDuration: () => void;
  /** Snooze by a standard period, resetting the task's duration. */
  onSnoozeStandard: (amount: number, unit: "week" | "month") => void;
  /** Snooze until a specific custom date. */
  onSnoozeUntil: (date: string) => void;
}

// Split button: clicking the body snoozes by the task's existing duration
// (the emphasized default). The caret opens standard periods, then Custom —
// tiers of: duration → standard → custom.
export function SnoozeButton({
  task,
  onSnoozeDuration,
  onSnoozeStandard,
  onSnoozeUntil,
}: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);

  return (
    <div className="split">
      <button
        className="split-main"
        title={`Snooze by ${task.duration.amount} ${task.duration.unit}`}
        onClick={onSnoozeDuration}
      >
        Snooze
      </button>
      <button
        className="split-caret"
        aria-label="Snooze options"
        onClick={() => {
          setOpen((o) => !o);
          setCustom(false);
        }}
      >
        ▾
      </button>

      {open && (
        <div className="menu" onMouseLeave={() => setOpen(false)}>
          <button
            onClick={() => {
              onSnoozeDuration();
              setOpen(false);
            }}
          >
            By duration ({task.duration.amount} {task.duration.unit})
          </button>
          <button
            onClick={() => {
              onSnoozeStandard(1, "week");
              setOpen(false);
            }}
          >
            1 week
          </button>
          <button
            onClick={() => {
              onSnoozeStandard(1, "month");
              setOpen(false);
            }}
          >
            1 month
          </button>
          {custom ? (
            <input
              type="date"
              autoFocus
              onChange={(e) => {
                if (e.target.value) {
                  onSnoozeUntil(e.target.value);
                  setOpen(false);
                }
              }}
            />
          ) : (
            <button onClick={() => setCustom(true)}>Custom…</button>
          )}
        </div>
      )}
    </div>
  );
}
