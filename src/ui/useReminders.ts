import { useEffect, useRef } from "react";
import type { Task } from "../core/types";
import { dueReminders } from "../core/reminders";

const CHECK_MS = 60_000;

/**
 * Fires local notifications for due reminders — but ONLY for the tasks
 * passed in (the caller passes the focus set), so notifications never
 * overload with everything that could possibly be done.
 *
 * True push-when-closed needs the Push API + a server; this covers the
 * app-open case. The schedule itself is computed by the pure
 * reminders engine and is fully tested.
 */
export function useReminders(focusTasks: Task[]) {
  const lastChecked = useRef<Date>(new Date());

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const due = dueReminders(focusTasks, lastChecked.current, now);
      lastChecked.current = now;
      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        for (const { task } of due) {
          new Notification(task.title, {
            body: task.description || "Reminder",
            tag: task.id,
          });
        }
      }
    };
    const h = setInterval(tick, CHECK_MS);
    return () => clearInterval(h);
  }, [focusTasks]);
}
