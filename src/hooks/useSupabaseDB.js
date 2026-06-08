import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useSupabaseDB() {
  const [profiles, setProfiles] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('exercises').select('*'),
      ]);
      setProfiles(p || []);
      setExercises(e || []);
      setLoading(false);
    }
    load();
  }, []);

  const addProfile = useCallback(async (name) => {
    if (profiles.length >= 3) return null;
    const profile = { id: genId(), name, updated_at: Date.now() };
    setProfiles(prev => [...prev, profile]);
    await supabase.from('profiles').insert(profile);
    return profile;
  }, [profiles]);

  const deleteProfile = useCallback(async (profileId) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    setExercises(prev => prev.filter(e => e.profile_id !== profileId));
    await supabase.from('profiles').delete().eq('id', profileId);
  }, []);

  const addExercise = useCallback(async (profileId, category, name) => {
    const ex = { id: genId(), profile_id: profileId, category, name, sessions: [], updated_at: Date.now() };
    setExercises(prev => [...prev, ex]);
    await supabase.from('exercises').insert(ex);
    return ex;
  }, []);

  const updateExerciseWeight = useCallback(async (exerciseId, weight, reps, ts) => {
    const now = Date.now();
    let profileId = null;
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      profileId = e.profile_id;
      const updated = { ...e, sessions: [...e.sessions, { weight, reps: reps || null, date: ts || now }], updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId);
      return updated;
    }));
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, updated_at: now } : p));
    if (profileId) await supabase.from('profiles').update({ updated_at: now }).eq('id', profileId);
  }, []);

  const deleteSet = useCallback(async (exerciseId, sessionIndex) => {
    const now = Date.now();
    let profileId = null;
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      profileId = e.profile_id;
      const updated = { ...e, sessions: e.sessions.filter((_, i) => i !== sessionIndex), updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId);
      return updated;
    }));
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, updated_at: now } : p));
  }, []);

  const editSet = useCallback(async (exerciseId, sessionIndex, weight, reps, ts) => {
    const now = Date.now();
    let profileId = null;
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      profileId = e.profile_id;
      const updated = { ...e, sessions: e.sessions.map((s, i) => i === sessionIndex ? { ...s, weight, reps: reps || null, date: ts } : s), updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId);
      return updated;
    }));
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, updated_at: now } : p));
  }, []);

  return { profiles, exercises, loading, addProfile, deleteProfile, addExercise, updateExerciseWeight, deleteSet, editSet };
}
