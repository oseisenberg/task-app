import { describe, expect, it } from "vitest";
import { dueReminders, nextReminder, reminderTimes } from "./reminders";
import { makeTask } from "./task";
import { emptyData } from "./store";
import { newId } from "./id";
import type { Reminder } from "./types";

function rem(p: Partial<Reminder>): Reminder {
  return { id: newId(), anchor: "start", timeOfDay: "morning", ...p };
}

describe("reminderTimes", () => {
  it("start-anchored, positive offset (glasses: remind in 5 days)", () => {
    const d = emptyData();
    const t = makeTask("glasses", d.settings);
    t.startDate = "2026-01-01";
    t.duration = { amount: 1, unit: "month" };
    t.reminders = [rem({ anchor: "start", offsetDays: 5 })];
    const [when] = reminderTimes(t);
    expect(when.getFullYear()).toBe(2026);
    expect(when.getMonth()).toBe(0);
    expect(when.getDate()).toBe(6);
    expect(when.getHours()).toBe(9);
  });

  it("start-anchored negative offset fires before the window (birthday)", () => {
    const d = emptyData();
    const t = makeTask("bday", d.settings);
    t.startDate = "2026-03-10";
    t.duration = { amount: 1, unit: "day" };
    t.reminders = [
      rem({ anchor: "start", offsetDays: -2 }),
      rem({ anchor: "start", offsetDays: 0, hour: 11 }),
    ];
    const times = reminderTimes(t);
    expect(times[0].getDate()).toBe(8);
    expect(times[1].getDate()).toBe(10);
    expect(times[1].getHours()).toBe(11);
  });

  it("evenly-spaced spreads count reminders across the window", () => {
    const d = emptyData();
    const t = makeTask("taxes", d.settings);
    t.startDate = "2026-01-01";
    t.duration = { amount: 30, unit: "day" };
    t.reminders = [rem({ anchor: "evenly-spaced", count: 3 })];
    // 30-day window, 3 reminders at 1/4, 2/4, 3/4 → Jan 9, 16, 24.
    const days = reminderTimes(t).map((x) => x.getDate());
    expect(days).toEqual([9, 16, 24]);
  });

  it("no-duration task yields no reminders", () => {
    const d = emptyData();
    const t = makeTask("x", d.settings);
    t.noDuration = true;
    t.reminders = [rem({})];
    expect(reminderTimes(t)).toEqual([]);
  });
});

describe("nextReminder / dueReminders", () => {
  it("nextReminder returns the first future time", () => {
    const d = emptyData();
    const t = makeTask("x", d.settings);
    t.startDate = "2026-01-01";
    t.duration = { amount: 10, unit: "day" };
    t.reminders = [rem({ anchor: "end", offsetDays: 0 })];
    expect(nextReminder(t, new Date("2026-01-05T00:00:00"))).not.toBeNull();
    expect(nextReminder(t, new Date("2026-02-01T00:00:00"))).toBeNull();
  });

  it("dueReminders finds reminders in (lastChecked, now]", () => {
    const d = emptyData();
    const t = makeTask("x", d.settings);
    t.startDate = "2026-01-01";
    t.duration = { amount: 10, unit: "day" };
    t.reminders = [rem({ anchor: "start", offsetDays: 0, hour: 9 })];
    const due = dueReminders(
      [t],
      new Date("2026-01-01T00:00:00"),
      new Date("2026-01-01T12:00:00")
    );
    expect(due).toHaveLength(1);
    expect(due[0].task.id).toBe(t.id);
  });
});
