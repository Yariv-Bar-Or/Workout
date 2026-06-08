"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useSupabaseDB() {
  const [profiles, setProfiles] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: p, error: pe }, { data: e, error: ee }] = await Promise.all([
          supabase.from("profiles").select("*").order("updated_at"),
          supabase.from("exercises").select("*").order("updated_at"),
        ]);
        if (pe) console.error("profiles fetch:", pe.message);
        if (ee) console.error("exercises fetch:", ee.message);
        setProfiles(p || []);
        setExercises(e || []);
      } catch (err) {
        console.error("load failed:", err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const addProfile = useCallback(async (name) => {
    if (profiles.length >= 3) return null;
    const profile = { id: genId(), name, updated_at: Date.now() };
    setProfiles(prev => [...prev, profile]);
    const { error } = await supabase.from("profiles").insert(profile);
    if (error) console.error("addProfile:", error.message);
    return profile;
  }, [profiles]);

  const deleteProfile = useCallback(async (profileId) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    setExercises(prev => prev.filter(e => e.profile_id !== profileId));
    // exercises cascade-delete via FK on delete cascade
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) console.error("deleteProfile:", error.message);
  }, []);

  const addExercise = useCallback(async (profileId, category, name) => {
    const ex = { id: genId(), profile_id: profileId, category, name, sessions: [], updated_at: Date.now() };
    setExercises(prev => [...prev, ex]);
    const { error } = await supabase.from("exercises").insert(ex);
    if (error) console.error("addExercise:", error.message);
    return ex;
  }, []);

  const updateExerciseWeight = useCallback(async (exerciseId, weight, reps, ts) => {
    const now = Date.now();
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    const profileId = ex.profile_id;
    const newSessions = [...ex.sessions, { weight, reps: reps || null, date: ts || now }];

    setExercises(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, sessions: newSessions, updated_at: now } : e
    ));
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, updated_at: now } : p
    ));

    const [{ error: ee }, { error: pe }] = await Promise.all([
      supabase.from("exercises").update({ sessions: newSessions, updated_at: now }).eq("id", exerciseId),
      supabase.from("profiles").update({ updated_at: now }).eq("id", profileId),
    ]);
    if (ee) console.error("updateExerciseWeight (exercise):", ee.message);
    if (pe) console.error("updateExerciseWeight (profile):", pe.message);
  }, [exercises]);

  const deleteSet = useCallback(async (exerciseId, sessionIndex) => {
    const now = Date.now();
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    const profileId = ex.profile_id;
    const newSessions = ex.sessions.filter((_, i) => i !== sessionIndex);

    setExercises(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, sessions: newSessions, updated_at: now } : e
    ));
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, updated_at: now } : p
    ));

    const [{ error: ee }, { error: pe }] = await Promise.all([
      supabase.from("exercises").update({ sessions: newSessions, updated_at: now }).eq("id", exerciseId),
      supabase.from("profiles").update({ updated_at: now }).eq("id", profileId),
    ]);
    if (ee) console.error("deleteSet (exercise):", ee.message);
    if (pe) console.error("deleteSet (profile):", pe.message);
  }, [exercises]);

  const editSet = useCallback(async (exerciseId, sessionIndex, weight, reps, ts) => {
    const now = Date.now();
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    const profileId = ex.profile_id;
    const newSessions = ex.sessions.map((s, i) =>
      i === sessionIndex ? { ...s, weight, reps: reps || null, date: ts } : s
    );

    setExercises(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, sessions: newSessions, updated_at: now } : e
    ));
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, updated_at: now } : p
    ));

    const [{ error: ee }, { error: pe }] = await Promise.all([
      supabase.from("exercises").update({ sessions: newSessions, updated_at: now }).eq("id", exerciseId),
      supabase.from("profiles").update({ updated_at: now }).eq("id", profileId),
    ]);
    if (ee) console.error("editSet (exercise):", ee.message);
    if (pe) console.error("editSet (profile):", pe.message);
  }, [exercises]);

  return { profiles, exercises, loading, addProfile, deleteProfile, updateExerciseWeight, addExercise, deleteSet, editSet };
}
