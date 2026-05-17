import { describe, expect, it } from "vitest";
import { NO_FILTERS, score, selectFocus } from "./focus";
import { makeTask } from "./task";
import { emptyData } from "./store";
import type { AppData } from "./types";

function withTasks(n: number): AppData {
  const d = emptyData();
  for (let i = 0; i < n; i++) d.tasks.push(makeTask(`t${i}`, d.settings));
  return d;
}

describe("score", () => {
  it("hard deadline outranks soft at the same priority/timeframe", () => {
    const d = emptyData();
    const soft = makeTask("soft", d.settings);
    soft.startDate = "2026-01-01";
    soft.duration = { amount: 10, unit: "day" };
    const hard = makeTask("hard", d.settings);
    hard.startDate = "2026-01-01";
    hard.explicitEndDate = "2026-01-11";
    expect(score(hard, "2026-01-05")).toBeGreaterThan(
      score(soft, "2026-01-05")
    );
  });

  it("higher priority scores higher all else equal", () => {
    const d = emptyData();
    const a = makeTask("a", d.settings);
    a.priority = 5;
    const b = makeTask("b", d.settings);
    b.priority = 1;
    expect(score(a, a.startDate)).toBeGreaterThan(score(b, b.startDate));
  });
});

describe("selectFocus", () => {
  it("respects target count", () => {
    const d = withTasks(20);
    d.settings.focusTargetCount = 5;
    expect(selectFocus(d).length).toBe(5);
  });

  it("reserves a slot for a low-priority task", () => {
    const d = emptyData();
    d.settings.focusTargetCount = 5;
    for (let i = 0; i < 8; i++) {
      const t = makeTask(`hi${i}`, d.settings);
      t.priority = 5;
      d.tasks.push(t);
    }
    const low = makeTask("low", d.settings);
    low.priority = 1;
    d.tasks.push(low);
    expect(selectFocus(d).some((t) => t.id === low.id)).toBe(true);
  });

  it("filters by tag (combinable, AND semantics)", () => {
    const d = emptyData();
    const clean = makeTask("clean", d.settings);
    clean.tags = ["cleaning"];
    const other = makeTask("other", d.settings);
    d.tasks.push(clean, other);
    const got = selectFocus(d, { ...NO_FILTERS, tags: ["cleaning"] });
    expect(got).toHaveLength(1);
    expect(got[0].id).toBe(clean.id);
  });

  it("excludes snoozed tasks", () => {
    const d = emptyData();
    const t = makeTask("snoozed", d.settings);
    t.snoozedUntil = "2999-01-01";
    d.tasks.push(t);
    expect(selectFocus(d, NO_FILTERS, 5, "2026-01-01")).toHaveLength(0);
  });
});
