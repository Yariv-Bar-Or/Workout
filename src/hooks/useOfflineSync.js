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
      // Deduplicate: for each exerciseId keep only the latest op (highest createdAt)
      const latest = new Map();
      for (const op of ops) {
        const existing = latest.get(op.payload.exerciseId);
        if (!existing || op.createdAt > existing.createdAt) {
          latest.set(op.payload.exerciseId, op);
        }
      }

      // Apply latest op per exercise, then dequeue all ops for that exercise
      const byExercise = new Map();
      for (const op of ops) {
        const arr = byExercise.get(op.payload.exerciseId) || [];
        arr.push(op);
        byExercise.set(op.payload.exerciseId, arr);
      }

      for (const [exerciseId, exerciseOps] of byExercise) {
        const latestOp = latest.get(exerciseId);
        const { error } = await supabase
          .from("exercises")
          .update({ sessions: latestOp.payload.sessions, updated_at: latestOp.payload.updatedAt })
          .eq("id", exerciseId)
          .eq("user_id", user.id);

        if (!error) {
          for (const op of exerciseOps) await dequeue(op.id);
        } else {
          console.error("[useOfflineSync] sync failed for", exerciseId, error);
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
