import { useCallback } from "react";
import { useSearchParams } from "react-router";

/**
 * List filters (search, page, any filter) kept in the URL so they survive
 * reloads and can be shared. Changing a filter resets to page 1.
 */
export function useListQuery<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();

  const values = Object.fromEntries(keys.map((k) => [k, params.get(k) ?? ""])) as Record<K, string>;
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  const set = useCallback(
    (key: K | "page", value: string | number) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "" || value === null) next.delete(key);
          else next.set(key, String(value));
          if (key !== "page") next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { values, page, set };
}
