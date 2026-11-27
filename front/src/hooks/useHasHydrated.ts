"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
