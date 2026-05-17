import { useMemo, useState } from "react";
import type { AppData, Task } from "../core/types";
import { deleteTask, upsertTask } from "../core/mutations";
import { TaskEditor } from "./TaskEditor";

interface Props {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

// Search is for finding/editing a specific thing — not browsing everything.
export function SearchView({ data, update }: Props) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);

  const { activeNonArchived, inactive, archived } = useMemo(() => {
    const match = (t: Task) =>
      q.trim() === "" ||
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()));
    const tasks = data.tasks.filter(match);
    return {
      activeNonArchived: tasks.filter((t) => t.active && !t.archived),
      inactive: tasks.filter((t) => !t.active && !t.archived),
      archived: tasks.filter((t) => t.archived),
    };
  }, [data.tasks, q]);

  const section = (label: string, tasks: Task[]) =>
    tasks.length > 0 && (
      <section>
        <h3>{label}</h3>
        <ul className="task-list">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="task"
              onClick={() => setEditing(t)}
            >
              <span className="title grow">{t.title}</span>
              <span className="meta">
                {t.kind} · P{t.priority}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <div className="view">
      <input
        className="search"
        value={q}
        placeholder="Search to find or edit…"
        onChange={(e) => setQ(e.target.value)}
      />
      {section("Active", activeNonArchived)}
      {section("Not active", inactive)}
      {/* Archived listed in its own section BELOW the not-active section. */}
      {section("Archived", archived)}

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
