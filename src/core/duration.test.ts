import { describe, expect, it } from "vitest";
import {
  addDuration,
  daysBetween,
  durationSoStartIsToday,
  resolveWindow,
} from "./duration";
import { makeTask } from "./task";
import { DEFAULT_SETTINGS } from "./types";

describe("addDuration", () => {
  it("adds months", () => {
    expect(addDuration("2026-01-15", { amount: 1, unit: "month" })).toBe(
      "2026-02-15"
    );
  });
  it("subtracts with sign", () => {
    expect(addDuration("2026-01-15", { amount: 7, unit: "day" }, -1)).toBe(
      "2026-01-08"
    );
  });
});

describe("resolveWindow", () => {
  it("anchor=start: soft deadline implied by duration", () => {
    const t = makeTask("x", DEFAULT_SETTINGS);
    t.startDate = "2026-01-01";
    t.duration = { amount: 1, unit: "month" };
    const w = resolveWindow(t)!;
    expect(w.start).toBe("2026-01-01");
    expect(w.end).toBe("2026-02-01");
    expect(w.hardDeadline).toBe(false);
  });

  it("explicit end date makes the deadline hard", () => {
    const t = makeTask("x", DEFAULT_SETTINGS);
    t.startDate = "2026-01-01";
    t.explicitEndDate = "2026-01-10";
    const w = resolveWindow(t)!;
    expect(w.end).toBe("2026-01-10");
    expect(w.hardDeadline).toBe(true);
  });

  it("anchor=end: window measured back from the deadline (taxes)", () => {
    const t = makeTask("taxes", DEFAULT_SETTINGS);
    t.durationAnchor = "end";
    t.explicitEndDate = "2026-04-15";
    t.duration = { amount: 2, unit: "month" };
    const w = resolveWindow(t)!;
    expect(w.end).toBe("2026-04-15");
    expect(w.start).toBe("2026-02-15");
    expect(w.hardDeadline).toBe(true);
  });

  it("noDuration tasks have no window", () => {
    const t = makeTask("x", DEFAULT_SETTINGS);
    t.noDuration = true;
    expect(resolveWindow(t)).toBeNull();
  });
});

describe("durationSoStartIsToday", () => {
  it("yields a day-duration spanning today..end", () => {
    expect(durationSoStartIsToday("2026-01-11", "2026-01-01")).toEqual({
      amount: 10,
      unit: "day",
    });
  });
});

describe("daysBetween", () => {
  it("counts calendar days", () => {
    expect(daysBetween("2026-01-01", "2026-01-08")).toBe(7);
  });
});
