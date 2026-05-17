import { useState } from "react";
import type { Duration, Task } from "../core/types";
import { durationSoStartIsToday, todayISO } from "../core/duration";
import { newId } from "../core/id";

interface Props {
  task: Task;
  onSave: (t: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const UNITS: Duration["unit"][] = ["day", "week", "month", "year"];

export function TaskEditor({ task, onSave, onDelete, onClose }: Props) {
  const [t, setT] = useState<Task>(task);
  const set = <K extends keyof Task>(k: K, v: Task[K]) =>
    setT((p) => ({ ...p, [k]: v }));

  const setDuration = (patch: Partial<Duration>) =>
    set("duration", { ...t.duration, ...patch });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="big"
          value={t.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Title"
        />
        <textarea
          value={t.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Description"
        />

        <div className="field">
          <label>Kind</label>
          <select
            value={t.kind}
            onChange={(e) => {
              const kind = e.target.value as Task["kind"];
              set("kind", kind);
              if (kind === "recurring" && !t.recurrence)
                set("recurrence", {
                  basis: "completion",
                  every: { ...t.duration },
                });
            }}
          >
            <option value="oneoff">One-off</option>
            <option value="recurring">Recurring</option>
          </select>
        </div>

        {/* Duration is the primary decision. */}
        <fieldset disabled={t.noDuration}>
          <legend>Duration</legend>
          <div className="field">
            <label>Length</label>
            <input
              type="number"
              min={0}
              value={t.duration.amount}
              onChange={(e) =>
                setDuration({ amount: Number(e.target.value) })
              }
            />
            <select
              value={t.duration.unit}
              onChange={(e) =>
                setDuration({ unit: e.target.value as Duration["unit"] })
              }
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Anchored to</label>
            <select
              value={t.durationAnchor}
              onChange={(e) =>
                set("durationAnchor", e.target.value as Task["durationAnchor"])
              }
            >
              <option value="start">Start date</option>
              <option value="end">End date (deadline)</option>
            </select>
          </div>
          <div className="field">
            <label>Start</label>
            <input
              type="date"
              value={t.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
        </fieldset>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={t.noDuration}
            onChange={(e) => set("noDuration", e.target.checked)}
          />
          No duration (exception)
        </label>

        {/* Explicit end date == hard deadline. */}
        <div className="field">
          <label>Hard deadline</label>
          <input
            type="date"
            value={t.explicitEndDate ?? ""}
            onChange={(e) =>
              set("explicitEndDate", e.target.value || null)
            }
          />
          {t.explicitEndDate && (
            <button
              type="button"
              onClick={() =>
                set(
                  "duration",
                  durationSoStartIsToday(t.explicitEndDate!)
                )
              }
            >
              Duration so start = today
            </button>
          )}
        </div>

        <div className="field">
          <label>Priority</label>
          <select
            value={t.priority}
            onChange={(e) =>
              set("priority", Number(e.target.value) as Task["priority"])
            }
          >
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                P{p}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tags</label>
          <input
            value={t.tags.join(", ")}
            placeholder="cleaning, errands…"
            onChange={(e) =>
              set(
                "tags",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>

        <div className="subtasks">
          <label>Subtasks</label>
          {t.subtasks.map((s, i) => (
            <div className="field" key={s.id}>
              <input
                value={s.title}
                onChange={(e) => {
                  const subs = [...t.subtasks];
                  subs[i] = { ...s, title: e.target.value };
                  set("subtasks", subs);
                }}
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "subtasks",
                    t.subtasks.filter((x) => x.id !== s.id)
                  )
                }
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("subtasks", [
                ...t.subtasks,
                { id: newId(), title: "", done: false },
              ])
            }
          >
            + Subtask
          </button>
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={t.confirmOnComplete}
            onChange={(e) => set("confirmOnComplete", e.target.checked)}
          />
          Confirm on complete (show description on subtasks too)
        </label>

        <div className="editor-actions">
          {t.kind === "recurring" && (
            <button
              type="button"
              onClick={() => set("startDate", todayISO())}
            >
              Move to today
            </button>
          )}
          <button type="button" onClick={() => onDelete(t.id)}>
            Delete
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => onSave(t)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
