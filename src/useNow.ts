import { useEffect, useState } from 'react';

// Current time that refreshes every minute, so Past / Upcoming labels stay right while a page stays open.
export function useNow(intervalMs = 60000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
