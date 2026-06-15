"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

const LS_END_KEY = "timerEndTime";
const LS_TOTAL_KEY = "timerTotalSeconds";
const BC_CHANNEL = "rest-timer";

export function useRestTimer(userId) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const activeRef = useRef(false); // guards against double-fire from setTimeout + setInterval racing
  const userIdRef = useRef(userId);
  const endTimeRef = useRef(0);          // current timer's endTime; tab-local, immune to other tabs' localStorage cleanup
  const channelRef = useRef(null);       // BroadcastChannel for cross-tab coordination
  const suppressedRef = useRef(new Set()); // endTimes claimed by another tab while we were about to fire

  // Keep userIdRef current on every render without destabilising callback dep arrays
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Cross-tab coordination: one BroadcastChannel per tab, shared channel name.
  // BroadcastChannel does NOT echo messages back to the sender, so we only
  // hear from other tabs — no self-suppression risk.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return; // graceful degradation (iOS < 15.4)
    const ch = new BroadcastChannel(BC_CHANNEL);
    ch.onmessage = ({ data }) => {
      if (data?.type === "expiry-claim" && data.endTime) {
        suppressedRef.current.add(data.endTime);
      }
    };
    channelRef.current = ch;
    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, []);

  const deleteActiveTimer = useCallback(() => {
    if (!userIdRef.current) return;
    supabase
      .from("active_timers")
      .delete()
      .eq("user_id", userIdRef.current)
      .catch(console.error);
  }, []);

  const handleExpiry = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;

    // Read endTime from our own ref (not localStorage) so it's available even if
    // another tab already cleared the LS key a few ms before us.
    const endTime = endTimeRef.current;

    localStorage.removeItem(LS_END_KEY);
    localStorage.removeItem(LS_TOTAL_KEY);
    setSecondsLeft(0);
    setIsRunning(false);

    // Cross-tab coordination: if another tab already claimed this expiry,
    // do a clean shutdown (no overlay, no push, no active_timers delete).
    if (endTime && suppressedRef.current.has(endTime)) {
      suppressedRef.current.delete(endTime);
      return;
    }

    // This tab wins. Announce claim so other tabs suppress themselves,
    // then run the full side effects.
    if (endTime) channelRef.current?.postMessage({ type: "expiry-claim", endTime });
    setTimerComplete(true);
    deleteActiveTimer();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      fetch("/api/push/send", { method: "POST" }).catch(() => {});
    }
  }, [deleteActiveTimer]);

  const startCountdown = useCallback((endTime, total) => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    activeRef.current = true;
    endTimeRef.current = endTime; // store for cross-tab coordination

    const msLeft = endTime - Date.now();
    if (msLeft <= 0) {
      handleExpiry();
      return;
    }

    setTotalSeconds(total);
    setIsRunning(true);

    // Exact-time expiry: fires at the precise millisecond regardless of tab throttling
    timeoutRef.current = setTimeout(handleExpiry, msLeft);

    // Visual countdown: updates display every second (throttled in background but display-only)
    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        handleExpiry();
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);
  }, [handleExpiry]);

  // On mount: resume if a timer was active when the app was last closed
  useEffect(() => {
    const endTime = parseInt(localStorage.getItem(LS_END_KEY) || "0", 10);
    const total = parseInt(localStorage.getItem(LS_TOTAL_KEY) || "0", 10);
    if (!endTime || !total) return;
    const remaining = Math.round((endTime - Date.now()) / 1000);
    if (remaining > 0) {
      setSecondsLeft(remaining);
      startCountdown(endTime, total); // sets endTimeRef.current
    } else {
      // Timer expired while the app was closed. Set endTimeRef before calling
      // handleExpiry (startCountdown was never called on this path, so the ref
      // would otherwise be stale). Also arm activeRef — see B2 fix comments.
      endTimeRef.current = endTime;
      activeRef.current = true;
      handleExpiry();
    }
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [startCountdown, handleExpiry]);

  // When app returns to foreground: recalculate from localStorage end time
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      const endTime = parseInt(localStorage.getItem(LS_END_KEY) || "0", 10);
      const total = parseInt(localStorage.getItem(LS_TOTAL_KEY) || "0", 10);
      if (!endTime) return;
      const remaining = Math.round((endTime - Date.now()) / 1000);
      if (remaining > 0) {
        setSecondsLeft(remaining);
        startCountdown(endTime, total); // sets endTimeRef.current
      } else {
        // Same rationale as the mount effect.
        endTimeRef.current = endTime;
        activeRef.current = true;
        handleExpiry();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [startCountdown, handleExpiry]);

  const startTimer = useCallback((duration) => {
    if (!duration || duration <= 0) return;
    const endTime = Date.now() + duration * 1000;
    localStorage.setItem(LS_END_KEY, endTime.toString());
    localStorage.setItem(LS_TOTAL_KEY, duration.toString());
    setTimerComplete(false);
    setSecondsLeft(duration);
    suppressedRef.current.clear(); // discard any suppression from the previous timer
    startCountdown(endTime, duration); // sets endTimeRef.current
    if (userIdRef.current) {
      supabase
        .from("active_timers")
        .upsert({ user_id: userIdRef.current, ends_at: endTime }, { onConflict: "user_id" })
        .catch(console.error);
    }
  }, [startCountdown]);

  const skipTimer = useCallback(() => {
    activeRef.current = false;
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    endTimeRef.current = 0;
    suppressedRef.current.clear();
    localStorage.removeItem(LS_END_KEY);
    localStorage.removeItem(LS_TOTAL_KEY);
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    setTimerComplete(false);
    deleteActiveTimer();
  }, [deleteActiveTimer]);

  const dismissComplete = useCallback(() => {
    setTimerComplete(false);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, timerComplete, startTimer, skipTimer, dismissComplete };
}
