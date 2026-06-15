"use client";

import { useState, useEffect, useCallback } from "react";
import { getAll, dequeue } from "@/lib/offlineQueue";
import { supabase } from "@/lib/supabase";

function genId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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
          // Legacy op from before the RPC migration. The payload is a full
          // sessions array snapshot — doing a full-array replace here would
          // overwrite any sessions appended by another device since this op
          // was enqueued. Instead: fetch current server state, then append
          // only sessions that are missing from it.
          const { data: current, error: fetchErr } = await supabase
            .from("exercises")
            .select("sessions")
            .eq("id", op.payload.exerciseId)
            .eq("user_id", user.id)
            .single();

          if (fetchErr) {
            error = fetchErr;
          } else {
            const serverKeys = new Set(
              (current?.sessions ?? []).map(s => `${s.date}:${s.weight}:${s.reps ?? ""}`)
            );
            const missing = op.payload.sessions.filter(
              s => !serverKeys.has(`${s.date}:${s.weight}:${s.reps ?? ""}`)
            );
            for (const s of missing) {
              const { error: appendErr } = await supabase.rpc("append_session", {
                p_exercise_id: op.payload.exerciseId,
                p_session:     s.id ? s : { ...s, id: genId() },
                p_updated_at:  op.payload.updatedAt,
              });
              if (appendErr) { error = appendErr; break; }
            }
          }
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
