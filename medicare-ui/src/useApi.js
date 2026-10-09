import { useEffect, useState } from "react";
import { api } from "./api.js";

/** Charge `path` (GET). Passer null pour ne rien charger. */
export function useApi(path) {
  const [state, setState] = useState({ loading: Boolean(path), status: null, ok: false, data: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) {
      setState({ loading: false, status: null, ok: false, data: null });
      return undefined;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    api(path).then((r) => {
      if (alive) setState({ loading: false, status: r.status, ok: r.ok, data: r.data });
    });
    return () => {
      alive = false;
    };
  }, [path, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
