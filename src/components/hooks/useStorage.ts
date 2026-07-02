import type { WxtStorageItem } from "@wxt-dev/storage";
import { useEffect, useState } from "react";

/**
 * Subscribes to a WXT typed storage item and re-renders on changes.
 *
 * @param item - A typed storage item created with `storage.defineItem()`
 * @param fallback - Value to use before the first async read resolves
 * @returns A `[value, setValue]` tuple analogous to `useState`
 */
export function useStorage<T>(
  item: WxtStorageItem<T, Record<string, unknown>>,
  fallback: T,
): [T, (value: T) => Promise<void>] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;

    item.getValue().then((v) => {
      if (!cancelled) setValue(v);
    });

    const unwatch = item.watch((v) => setValue(v));

    return () => {
      cancelled = true;
      unwatch();
    };
  }, [item]);

  return [value, (next) => item.setValue(next)];
}
