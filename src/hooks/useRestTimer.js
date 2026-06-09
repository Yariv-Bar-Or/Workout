"use client";
import { useState, useEffect, useCallback } from "react";

export function useRestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Tick once per second while running
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isRunning, secondsLeft]);

  // When countdown hits 0: alert and auto-dismiss
  useEffect(() => {
    if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      window.alert("⏱ סיום מנוחה! לחץ אישור להמשיך");
    }
  }, [isRunning, secondsLeft]);

  const startTimer = useCallback((duration) => {
    if (!duration || duration <= 0) return;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsRunning(true);
  }, []);

  const skipTimer = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, startTimer, skipTimer };
}
