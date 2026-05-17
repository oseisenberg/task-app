import { describe, expect, it } from "vitest";
import {
  completeTask,
  markProgress,
  moveToToday,
  patchTask,
  setSubtasksDone,
  snoozeByDuration,
  snoozeByNewDuration,
  snoozeUntil,
  upsertTask,
} from "./mutations";
import { newId } from "./id";
import { makeTask } from "./task";
import { emptyData } from "./store";
import { todayISO } from "./duration";

describe("completeTask", () => {
  it("one-off becomes inactive and records end date", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings);
    d = upsertTask(d, t);
    d = completeTask(d, t.id, "2026-02-01");
    expect(d.tasks[0].active).toBe(false);
    expect(d.tasks[0].completionHistory).toEqual(["2026-02-01"]);
  });

  it("recurring rolls forward from completion date by default", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings, "recurring");
    t.recurrence = { basis: "completion", every: { amount: 1, unit: "week" } };
    d = upsertTask(d, t);
    d = completeTask(d, t.id, "2026-02-01");
    expect(d.tasks[0].active).toBe(true);
    expect(d.tasks[0].startDate).toBe("2026-02-08");
  });
});

describe("moveToToday", () => {
  it("sets start date to today", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings, "recurring");
    t.startDate = "2020-01-01";
    d = upsertTask(d, t);
    d = moveToToday(d, t.id);
    expect(d.tasks[0].startDate).toBe(todayISO());
  });
});

describe("snooze", () => {
  it("snoozeByDuration uses the task's own duration, leaving it unchanged", () => {
    let d = emptyData();
    const t = makeTask("mail", d.settings);
    t.duration = { amount: 1, unit: "week" };
    d = upsertTask(d, t);
    d = snoozeByDuration(d, t.id, "2026-01-01");
    expect(d.tasks[0].snoozedUntil).toBe("2026-01-08");
    expect(d.tasks[0].duration).toEqual({ amount: 1, unit: "week" });
  });

  it("snoozeByNewDuration resets the task's duration (default behavior)", () => {
    let d = emptyData();
    const t = makeTask("mail", d.settings);
    t.duration = { amount: 1, unit: "week" };
    d = upsertTask(d, t);
    d = snoozeByNewDuration(d, t.id, { amount: 1, unit: "month" }, "2026-01-01");
    expect(d.tasks[0].duration).toEqual({ amount: 1, unit: "month" });
    expect(d.tasks[0].snoozedUntil).toBe("2026-02-01");
  });

  it("snoozeUntil treats a date as a day-duration from today", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings);
    d = upsertTask(d, t);
    d = snoozeUntil(d, t.id, "2026-01-11", "2026-01-01");
    expect(d.tasks[0].duration).toEqual({ amount: 10, unit: "day" });
    expect(d.tasks[0].snoozedUntil).toBe("2026-01-11");
  });
});

describe("markProgress", () => {
  it("hides ~1 week by default", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings);
    d = upsertTask(d, t);
    d = markProgress(d, t.id, 7, "2026-01-01");
    expect(d.tasks[0].progressMadeUntil).toBe("2026-01-08");
  });

  it("never hides past a hard deadline", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings);
    t.startDate = "2026-01-01";
    t.explicitEndDate = "2026-01-04";
    d = upsertTask(d, t);
    d = markProgress(d, t.id, 7, "2026-01-01");
    expect(d.tasks[0].progressMadeUntil).toBe("2026-01-04");
  });
});

describe("setSubtasksDone", () => {
  it("sets only the listed subtasks done", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings);
    const a = newId();
    const b = newId();
    t.subtasks = [
      { id: a, title: "a", done: false },
      { id: b, title: "b", done: false },
    ];
    d = upsertTask(d, t);
    d = setSubtasksDone(d, t.id, [a]);
    expect(d.tasks[0].subtasks.find((s) => s.id === a)!.done).toBe(true);
    expect(d.tasks[0].subtasks.find((s) => s.id === b)!.done).toBe(false);
  });
});

describe("patchTask", () => {
  it("merges fields", () => {
    let d = emptyData();
    const t = makeTask("x", d.settings);
    d = upsertTask(d, t);
    d = patchTask(d, t.id, { priority: 5 });
    expect(d.tasks[0].priority).toBe(5);
  });
});
