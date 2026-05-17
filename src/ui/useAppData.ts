import { useCallback, useEffect, useState } from "react";
import { load, save } from "../core/store";
import type { AppData } from "../core/types";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => load());

  useEffect(() => {
    save(data);
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => fn(prev));
  }, []);

  return { data, setData, update };
}
