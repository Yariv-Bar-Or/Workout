"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useVoiceInput } from "./useVoiceInput";

export function useVoiceLogger(exercises, updateExerciseWeight) {
  const voice = useVoiceInput();
  const [pendingQueue, setPendingQueue] = useState([]);
  const pendingConfirm = pendingQueue[0] ?? null;
  const [parseError, setParseError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const exercisesRef = useRef(exercises);
  exercisesRef.current = exercises;

  // Clear previous results when user starts a new recording
  useEffect(() => {
    if (voice.isListening) {
      setPendingQueue([]);
      setParseError(null);
    }
  }, [voice.isListening]);

  // Parse transcript when speech recognition delivers a result
  useEffect(() => {
    if (!voice.transcript) return;
    const exList = exercisesRef.current;

    async function run() {
      setIsParsing(true);
      setParseError(null);
      try {
        const res = await fetch("/api/parse-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: voice.transcript,
            exercises: exList.map((e) => ({ id: e.id, name: e.name, category: e.category })),
          }),
        });

        if (res.status === 401) {
          setParseError("פג תוקף החיבור — יש להתחבר מחדש.");
          return;
        }
        if (!res.ok) {
          setParseError("שגיאת שרת, נסה שנית.");
          return;
        }

        const data = await res.json();

        if (data.error === "invalid_value") {
          setParseError(
            data.field === "weight"
              ? "לא הצלחתי להבין את המשקל, נסה שנית."
              : "לא הצלחתי להבין את מספר החזרות, נסה שנית."
          );
          return;
        }

        if (data.error || !data.sets?.length) throw new Error("parse failed");

        // Build queue of confirm cards, one per set
        const queue = data.sets
          .filter((s) => s.weight != null)
          .map((s) => {
            const matched = exList.find(
              (e) => e.name.toLowerCase() === s.exerciseName?.toLowerCase()
            ) ?? null;
            return {
              ...s,
              exerciseId: matched?.id ?? null,
              displayName: matched?.name ?? s.exerciseName,
            };
          });

        if (!queue.length) throw new Error("parse failed");
        setPendingQueue(queue);
      } catch {
        setParseError("לא הצלחתי לפרש את הקלט. נסה שנית.");
      } finally {
        setIsParsing(false);
      }
    }

    run();
  }, [voice.transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmLog = useCallback(
    (exerciseId, weight, reps) => {
      if (!exerciseId || !weight) return;
      updateExerciseWeight(exerciseId, weight, reps ?? null, Date.now());
      setPendingQueue((q) => q.slice(1));
      setParseError(null);
    },
    [updateExerciseWeight]
  );

  const cancelConfirm = useCallback(() => {
    setPendingQueue([]);
    setParseError(null);
  }, []);

  const skipSet = useCallback(() => {
    setPendingQueue((q) => q.slice(1));
  }, []);

  return {
    isListening: voice.isListening,
    transcript: voice.transcript,
    voiceError: voice.error,
    startListening: voice.startListening,
    stopListening: voice.stopListening,
    isSupported: voice.isSupported,
    isParsing,
    pendingConfirm,
    pendingQueue,
    parseError,
    confirmLog,
    cancelConfirm,
    skipSet,
  };
}
