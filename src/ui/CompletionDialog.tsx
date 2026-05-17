import { useState } from "react";
import type { Task } from "../core/types";
import { todayISO } from "../core/duration";

interface Props {
  task: Task;
  onConfirm: (endDate: string, doneSubtaskIds: string[]) => void;
  onCancel: () => void;
}

// Completing a task ALWAYS requires an end date (default today) — without
// one a task effectively never gets done. When confirmOnComplete is set the
// description is shown here, and on subtasks too. Subtasks are NOT shown
// pre-checked even if previously marked done.
export function CompletionDialog({ task, onConfirm, onCancel }: Props) {
  const [endDate, setEndDate] = useState(todayISO());
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Complete: {task.title}</h2>

        {task.confirmOnComplete && task.description && (
          <p className="meta">{task.description}</p>
        )}

        {task.subtasks.length > 0 && (
          <div className="subtasks">
            {task.subtasks.map((s) => (
              <label className="checkbox" key={s.id}>
                <input
                  type="checkbox"
                  checked={done.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
                {s.title}
                {task.confirmOnComplete && s.description && (
                  <span className="meta"> — {s.description}</span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="field">
          <label>Completed on</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="editor-actions">
          <button onClick={onCancel}>Cancel</button>
          <button
            className="primary"
            disabled={!endDate}
            onClick={() => onConfirm(endDate, [...done])}
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}
