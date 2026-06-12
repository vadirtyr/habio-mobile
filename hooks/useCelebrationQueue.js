import { useCallback, useMemo, useState } from "react";

import { api } from "../lib/api";

function mergeCelebrations(current, incoming) {
  const byId = new Map(current.map((item) => [item.id, item]));

  (incoming || []).forEach((item) => {
    if (item?.id) byId.set(item.id, item);
  });

  return [...byId.values()].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );
}

export function useCelebrationQueue() {
  const [celebrations, setCelebrations] = useState([]);

  const enqueueCelebrations = useCallback((items) => {
    if (!items?.length) return;
    setCelebrations((current) => mergeCelebrations(current, items));
  }, []);

  const loadPendingCelebrations = useCallback(async () => {
    try {
      const data = await api.getPendingCelebrations();
      enqueueCelebrations(data.items || []);
    } catch (error) {
      console.log("Unable to load celebrations", error);
    }
  }, [enqueueCelebrations]);

  const dismissCelebration = useCallback(async (celebration) => {
    if (!celebration) return;

    setCelebrations((current) =>
      current.filter((item) => item.id !== celebration.id)
    );

    try {
      await api.dismissCelebration(celebration.id);
    } catch (error) {
      console.log("Unable to dismiss celebration", error);
    }
  }, []);

  return useMemo(
    () => ({
      activeCelebration: celebrations[0] || null,
      celebrationCount: celebrations.length,
      enqueueCelebrations,
      loadPendingCelebrations,
      dismissCelebration,
    }),
    [
      celebrations,
      dismissCelebration,
      enqueueCelebrations,
      loadPendingCelebrations,
    ]
  );
}
