"use client";

import { useState, useEffect, useCallback } from "react";
import { getAll, dequeue } from "@/lib/offlineQueue";
import { supabase } from "@/lib/supabase";

export function useOfflineSync(user) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load initial count
  useEffect(() => {
    getAll().then(ops => setPendingCount(ops.length)).catch(() => {});
  }, []);

  // Keep count in sync with queue changes
  useEffect(() => {
    function onQueueChange(e) {
      setPendingCount(e.detail?.count ?? 0);
    }
    window.addEventListener("liftlog:queue-change", onQueueChange);
    return () => window.removeEventListener("liftlog:queue-change", onQueueChange);
  }, []);

  const syncQueue = useCallback(async () => {
    if (!user) return;
    const ops = await getAll();
    if (ops.length === 0) return;

    setIsSyncing(true);
    try {
      // Replay each op in creation order — atomic RPCs mean ordering is safe
      const sorted = [...ops].sort((a, b) => a.createdAt - b.createdAt);

      for (const op of sorted) {
        let error;

        if (op.type === "append_session") {
          ({ error } = await supabase.rpc("append_session", {
            p_exercise_id: op.payload.exerciseId,
            p_session:     op.payload.session,
            p_updated_at:  op.payload.updatedAt,
          }));
        } else if (op.type === "upsert_session") {
          // Legacy op format from before the RPC migration: fall back to full-array replace
          ({ error } = await supabase
            .from("exercises")
            .update({ sessions: op.payload.sessions, updated_at: op.payload.updatedAt })
            .eq("id", op.payload.exerciseId)
            .eq("user_id", user.id));
        }

        if (!error) {
          await dequeue(op.id);
        } else {
          console.error("[useOfflineSync] sync failed for op", op.id, error);
        }
      }
    } catch (err) {
      console.error("[useOfflineSync] syncQueue error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Sync on online event
  useEffect(() => {
    function onOnline() { syncQueue(); }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [syncQueue]);

  // Sync on service worker message
  useEffect(() => {
    if (!navigator.serviceWorker) return;
    function onMessage(e) {
      if (e.data?.type === "SYNC_QUEUE") syncQueue();
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [syncQueue]);

  return { pendingCount, isSyncing, syncQueue };
}
