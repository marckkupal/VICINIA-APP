import { useCallback, useEffect, useState } from 'react';
import { loadRequests, saveRequests } from './storage';
import type { OfficeKey, OfficeRequest, User } from './types';

// OSA / Guidance requests for the signed-in student, kept on this device.
export function useOfficeRequests(user: User, office: OfficeKey) {
  const [all, setAll] = useState<OfficeRequest[]>([]);

  useEffect(() => {
    let live = true;
    loadRequests(user.email).then((list) => { if (live) setAll(list); });
    return () => { live = false; };
  }, [user.email]);

  const commit = useCallback((next: OfficeRequest[]) => {
    setAll(next);
    saveRequests(user.email, next);
  }, [user.email]);

  const add = (r: OfficeRequest) => commit([r, ...all]);
  const cancel = (id: string) => commit(all.map((r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r)));

  return { items: all.filter((r) => r.office === office), add, cancel };
}
