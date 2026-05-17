import { describe, expect, it } from "vitest";
import { deserialize, emptyData, merge, serialize } from "./store";
import { makeTask } from "./task";
import { upsertTask } from "./mutations";

describe("serialize / deserialize", () => {
  it("round-trips", () => {
    let d = emptyData();
    d = upsertTask(d, makeTask("x", d.settings));
    expect(deserialize(serialize(d)).tasks[0].title).toBe("x");
  });

  it("normalizes a sparse hand-edited file", () => {
    const d = deserialize('{"tasks":[]}');
    expect(d.version).toBe(1);
    expect(d.settings.focusTargetCount).toBeGreaterThan(0);
  });
});

describe("merge", () => {
  it("overwrites by id, appends new, keeps untouched", () => {
    let cur = emptyData();
    const a = makeTask("a", cur.settings);
    const b = makeTask("b", cur.settings);
    cur = upsertTask(upsertTask(cur, a), b);

    const incoming = emptyData();
    incoming.tasks = [
      { ...a, title: "a-edited" },
      makeTask("c", incoming.settings),
    ];

    const m = merge(cur, incoming);
    const titles = m.tasks.map((t) => t.title).sort();
    expect(titles).toEqual(["a-edited", "b", "c"]);
  });
});
