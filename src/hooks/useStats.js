"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORY_LABELS = {
  chest:     "חזה",
  back:      "גב",
  shoulders: "כתפיים",
  biceps:    "יד קדמית",
  triceps:   "יד אחורית",
  legs:      "רגליים",
};

function dayStart(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function useStats(user) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("exercises")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) console.error("[useStats]", error);
        setExercises(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  const currentStreak = (() => {
    const allDays = new Set();
    for (const ex of exercises) {
      for (const s of (ex.sessions || [])) allDays.add(dayStart(s.date));
    }
    let streak = 0;
    let day = dayStart(Date.now());
    while (allDays.has(day)) {
      streak++;
      day -= 86400000;
    }
    return streak;
  })();

  const personalRecords = (() => {
    const records = [];
    for (const ex of exercises) {
      if (!ex.sessions?.length) continue;
      const best = ex.sessions.reduce((m, s) => s.weight > m.weight ? s : m, ex.sessions[0]);
      records.push({
        exerciseName: ex.name,
        muscleGroup:  CATEGORY_LABELS[ex.category] || ex.category,
        muscleKey:    ex.category,
        bestWeight:   best.weight,
        bestReps:     best.reps ?? null,
        date:         best.date,
      });
    }
    return records.sort((a, b) => a.muscleKey.localeCompare(b.muscleKey));
  })();

  function totalVolume(filter) {
    const now = Date.now();
    const cutoff = {
      today: dayStart(now),
      week:  now - 7  * 86400000,
      month: now - 30 * 86400000,
      all:   0,
    }[filter] ?? 0;
    let sum = 0;
    for (const ex of exercises) {
      for (const s of (ex.sessions || [])) {
        if (s.date >= cutoff && s.reps != null && s.reps > 0) sum += s.weight * s.reps;
      }
    }
    return Math.round(sum);
  }

  return { currentStreak, personalRecords, totalVolume, loading };
}
