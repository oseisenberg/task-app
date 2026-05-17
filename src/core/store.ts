// Local-first JSON store. The canonical source of truth is a single JSON
// document. It is persisted to localStorage for app use, and can be
// exported to / imported from a JSON file so Claude cowork can edit it
// out-of-band — no special integration, just a file the AI understands.

import { DEFAULT_SETTINGS, type AppData } from "./types";

const LS_KEY = "task-app:data:v1";

export function emptyData(): AppData {
  return { version: 1, settings: { ...DEFAULT_SETTINGS }, tasks: [] };
}

export function load(): AppData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyData();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

export function save(data: AppData): void {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

/** Serialize for file export — pretty-printed so the AI can edit it. */
export function serialize(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

/** Parse + validate an imported JSON file. Throws on malformed input. */
export function deserialize(text: string): AppData {
  const parsed = JSON.parse(text);
  return normalize(parsed);
}

/** Defensive normalization so hand/AI-edited files still load. */
export function normalize(input: unknown): AppData {
  const obj = (input ?? {}) as Partial<AppData>;
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, ...(obj.settings ?? {}) },
    tasks: Array.isArray(obj.tasks) ? obj.tasks : [],
  };
}
