import { useState } from "react";
import type { AppData, Task } from "../core/types";
import { makeTask } from "../core/task";
import { resolveWindow } from "../core/duration";
import {
  completeTask,
  deleteTask,
  upsertTask,
} from "../core/mutations";
import { TaskEditor } from "./TaskEditor";

interface Props {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

// Placeholder selection until Phase 3: active, non-archived, not snoozed /
// progress-hidden, ordered by priority then soft/hard deadline.
function focusTasks(data: AppData) {
  const today = new Date().toISOString().slice(0, 10);
  return data.tasks
    .filter(
      (t) =>
        t.active &&
        !t.archived &&
        (!t.snoozedUntil || t.snoozedUntil <= today) &&
        (!t.progressMadeUntil || t.progressMadeUntil <= today)
    )
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const ea = resolveWindow(a)?.end ?? "9999-12-31";
      const eb = resolveWindow(b)?.end ?? "9999-12-31";
      return ea.localeCompare(eb);
    })
    .slice(0, data.settings.focusTargetCount);
}

export function FocusView({ data, update }: Props) {
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const shown = focusTasks(data);

  const add = () => {
    const t = title.trim();
    if (!t) return;
    update((d) => ({ ...d, tasks: [...d.tasks, makeTask(t, d.settings)] }));
    setTitle("");
  };

  return (
    <div className="view">
      <div className="add-row">
        <input
          value={title}
          placeholder="Add a task…"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button onClick={add}>Add</button>
      </div>

      {shown.length === 0 ? (
        <p className="empty">Nothing in focus. Add a task to get started.</p>
      ) : (
        <ul className="task-list">
          {shown.map((task) => {
            const w = resolveWindow(task);
            return (
              <li key={task.id} className="task">
                <button
                  className="check"
                  title="Complete"
                  onClick={() => update((d) => completeTask(d, task.id))}
                >
                  ○
                </button>
                <span
                  className="title grow"
                  onClick={() => setEditing(task)}
                >
                  {task.title}
                </span>
                <span className="meta">
                  P{task.priority}
                  {w
                    ? ` · by ${w.end}${w.hardDeadline ? " (hard)" : ""}`
                    : " · no duration"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <TaskEditor
          task={editing}
          onSave={(t) => {
            update((d) => upsertTask(d, t));
            setEditing(null);
          }}
          onDelete={(id) => {
            update((d) => deleteTask(d, id));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
