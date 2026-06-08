import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useSupabaseDB(user) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExercises([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setExercises(data || []);
        setLoading(false);
      });
  }, [user]);

  const addExercise = useCallback(async (category, name) => {
    if (!user) return;
    const ex = { id: genId(), user_id: user.id, category, name, sessions: [], updated_at: Date.now() };
    setExercises(prev => [...prev, ex]);
    await supabase.from('exercises').insert(ex);
    return ex;
  }, [user]);

  const updateExerciseWeight = useCallback(async (exerciseId, weight, reps, ts) => {
    if (!user) return;
    const now = Date.now();
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const updated = { ...e, sessions: [...e.sessions, { weight, reps: reps || null, date: ts || now }], updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId).eq('user_id', user.id);
      return updated;
    }));
  }, [user]);

  const deleteSet = useCallback(async (exerciseId, sessionIndex) => {
    if (!user) return;
    const now = Date.now();
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const updated = { ...e, sessions: e.sessions.filter((_, i) => i !== sessionIndex), updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId).eq('user_id', user.id);
      return updated;
    }));
  }, [user]);

  const editSet = useCallback(async (exerciseId, sessionIndex, weight, reps, ts) => {
    if (!user) return;
    const now = Date.now();
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const updated = { ...e, sessions: e.sessions.map((s, i) => i === sessionIndex ? { ...s, weight, reps: reps || null, date: ts } : s), updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId).eq('user_id', user.id);
      return updated;
    }));
  }, [user]);

  return { exercises, loading, addExercise, updateExerciseWeight, deleteSet, editSet };
}
