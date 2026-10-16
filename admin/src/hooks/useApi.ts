import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

interface UseApiResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
  setData: (updater: T | null | ((prev: T | null) => T | null)) => void;
}

/**
 * Minimal data-fetching hook: refetches when `key` changes, ignores stale
 * responses, and exposes loading / error / reload.
 */
export function useApi<T>(fetcher: () => Promise<T>, key: unknown[]): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const serialisedKey = JSON.stringify(key);

  useEffect(() => {
    const id = ++requestId.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start of an async load
    setLoading(true);
    fetcherRef
      .current()
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setError(err instanceof ApiError ? err : new ApiError("Something went wrong.", 0));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [serialisedKey, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, reload, setData };
}
