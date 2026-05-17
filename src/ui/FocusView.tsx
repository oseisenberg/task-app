import { useEffect, useMemo, useRef, useState } from "react";
import type { AppData, Task } from "../core/types";
import { makeTask } from "../core/task";
import { resolveWindow } from "../core/duration";
import {
  completeTask,
  deleteTask,
  snoozeByDuration,
  snoozeByNewDuration,
  snoozeUntil,
  upsertTask,
} from "../core/mutations";
import { SnoozeButton } from "./SnoozeButton";
import {
  isAvailable,
  NO_FILTERS,
  selectFocus,
  type FocusFilters,
} from "../core/focus";
import { todayISO } from "../core/duration";
import { TaskEditor } from "./TaskEditor";

interface Props {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

const sameFilters = (a: FocusFilters, b: FocusFilters) =>
  a.minPriority === b.minPriority &&
  a.kinds.join() === b.kinds.join() &&
  a.tags.slice().sort().join() === b.tags.slice().sort().join();

export function FocusView({ data, update }: Props) {
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FocusFilters>(NO_FILTERS);

  // The focus set is a STICKY snapshot: it is chosen once, you work it down,
  // and "Load more" is only offered once it is empty (not by default).
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const lastFilters = useRef<FocusFilters | null>(null);

  // Load more: append the next-best batch of tasks not already in the set.
  const loadMore = () => {
    const next = selectFocus(
      { ...data, tasks: data.tasks.filter((t) => !focusIds.includes(t.id)) },
      filters
    ).map((t) => t.id);
    setFocusIds((prev) => [...prev, ...next]);
  };

  // Re-pick the snapshot when filters change.
  useEffect(() => {
    if (!lastFilters.current || !sameFilters(lastFilters.current, filters)) {
      lastFilters.current = filters;
      setFocusIds(selectFocus(data, filters).map((t) => t.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, data.tasks.length]);

  const allTags = useMemo(
    () => [...new Set(data.tasks.flatMap((t) => t.tags))].sort(),
    [data.tasks]
  );

  const today = todayISO();
  const byId = useMemo(
    () => new Map(data.tasks.map((t) => [t.id, t])),
    [data.tasks]
  );

  const shown = focusIds
    .map((id) => byId.get(id))
    .filter((t): t is Task => !!t && isAvailable(t, today));

  const overflow = data.tasks.filter(
    (t) => isAvailable(t, today) && !focusIds.includes(t.id)
  ).length;

  const add = () => {
    const t = title.trim();
    if (!t) return;
    update((d) => ({ ...d, tasks: [...d.tasks, makeTask(t, d.settings)] }));
    setTitle("");
  };

  const toggleTag = (tag: string) =>
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((x) => x !== tag)
        : [...f.tags, tag],
    }));

  const filtersActive =
    filters.tags.length > 0 ||
    filters.kinds.length > 0 ||
    filters.minPriority > 1;

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

      {/* Combinable custom filters on the same focus view. */}
      <div className="filters">
        {allTags.map((tag) => (
          <button
            key={tag}
            className={filters.tags.includes(tag) ? "chip on" : "chip"}
            onClick={() => toggleTag(tag)}
          >
            #{tag}
          </button>
        ))}
        <button
          className={filters.kinds.length ? "chip on" : "chip"}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              kinds: f.kinds.length ? [] : ["recurring"],
            }))
          }
        >
          recurring only
        </button>
        <button
          className={filters.minPriority > 1 ? "chip on" : "chip"}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              minPriority: f.minPriority > 1 ? 1 : 4,
            }))
          }
        >
          important only
        </button>
        {filtersActive && (
          <button className="chip" onClick={() => setFilters(NO_FILTERS)}>
            clear
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          {overflow > 0 ? (
            <>
              <p>All focus tasks done. {overflow} more available.</p>
              <button onClick={loadMore}>Load more</button>
            </>
          ) : (
            <p>Nothing to focus on. Add a task to get started.</p>
          )}
        </div>
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
                <SnoozeButton
                  task={task}
                  onSnoozeDuration={() =>
                    update((d) => snoozeByDuration(d, task.id))
                  }
                  onSnoozeStandard={(amount, unit) =>
                    update((d) =>
                      snoozeByNewDuration(d, task.id, { amount, unit })
                    )
                  }
                  onSnoozeUntil={(date) =>
                    update((d) => snoozeUntil(d, task.id, date))
                  }
                />
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
