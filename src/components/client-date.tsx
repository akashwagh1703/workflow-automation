"use client";

import { useSyncExternalStore } from "react";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Formats a date on the client only to avoid SSR/locale hydration mismatches. */
export function ClientDate({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const isClient = useIsClient();

  if (!value) {
    return <span className={className}>—</span>;
  }

  if (!isClient) {
    return <span className={className}>…</span>;
  }

  return (
    <span className={className}>{new Date(value).toLocaleString()}</span>
  );
}
