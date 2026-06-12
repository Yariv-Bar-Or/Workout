"use client";
import { useState, useEffect, useCallback } from "react";

export function useRestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);

  // Tick once per second while running
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isRunning, secondsLeft]);

  // When countdown hits 0
  useEffect(() => {
    if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      setTimerComplete(true);
    }
  }, [isRunning, secondsLeft]);

  const startTimer = useCallback((duration) => {
    if (!duration || duration <= 0) return;
    setTimerComplete(false);
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsRunning(true);
  }, []);

  const skipTimer = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    setTimerComplete(false);
  }, []);

  const dismissComplete = useCallback(() => {
    setTimerComplete(false);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, timerComplete, startTimer, skipTimer, dismissComplete };
}
