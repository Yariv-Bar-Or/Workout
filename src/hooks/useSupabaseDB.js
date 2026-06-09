import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { enqueue } from '../lib/offlineQueue';

function genOfflineId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function showToast(message) {
  if (typeof document === "undefined") return;
  const toast = document.createElement("div");
  toast.style.cssText = [
    "position:fixed", "bottom:80px", "right:16px", "z-index:9999",
    "background:#1a1a1a", "border:1px solid #333", "border-radius:10px",
    "padding:10px 16px", "color:#f0ede8", "font-size:13px",
    "direction:rtl", "box-shadow:0 4px 16px rgba(0,0,0,0.5)",
    "font-family:system-ui,-apple-system,sans-serif",
  ].join(";");
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

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
      .then(({ data, error }) => {
        if (error) console.error('Supabase error:', error);
        setExercises(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  const addExercise = useCallback(async (category, name) => {
    if (!user) return;
    const ex = { id: genId(), user_id: user.id, category, name, sessions: [], updated_at: Date.now() };
    setExercises(prev => [...prev, ex]);
    await supabase.from('exercises').insert(ex)
      .then(({ error }) => { if (error) console.error('Supabase error:', error); });
    return ex;
  }, [user]);

  const updateExerciseWeight = useCallback(async (exerciseId, weight, reps, ts) => {
    if (!user) return;
    const now = Date.now();
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const updated = { ...e, sessions: [...e.sessions, { weight, reps: reps || null, date: ts || now }], updated_at: now };
      if (navigator.onLine) {
        supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId).eq('user_id', user.id)
          .then(({ error }) => { if (error) console.error('Supabase error:', error); });
      } else {
        enqueue({
          id: genOfflineId(),
          type: 'upsert_session',
          payload: { exerciseId, sessions: updated.sessions, userId: user.id, updatedAt: now },
          createdAt: now,
        }).catch(err => console.error('enqueue error:', err));
        showToast('נשמר באופן מקומי — יסונכרן כשהחיבור יחזור');
      }
      return updated;
    }));
  }, [user]);

  const deleteSet = useCallback(async (exerciseId, sessionIndex) => {
    if (!user) return;
    const now = Date.now();
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const updated = { ...e, sessions: e.sessions.filter((_, i) => i !== sessionIndex), updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId).eq('user_id', user.id)
        .then(({ error }) => { if (error) console.error('Supabase error:', error); });
      return updated;
    }));
  }, [user]);

  const editSet = useCallback(async (exerciseId, sessionIndex, weight, reps, ts) => {
    if (!user) return;
    const now = Date.now();
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const updated = { ...e, sessions: e.sessions.map((s, i) => i === sessionIndex ? { ...s, weight, reps: reps || null, date: ts } : s), updated_at: now };
      supabase.from('exercises').update({ sessions: updated.sessions, updated_at: now }).eq('id', exerciseId).eq('user_id', user.id)
        .then(({ error }) => { if (error) console.error('Supabase error:', error); });
      return updated;
    }));
  }, [user]);

  return { exercises, loading, addExercise, updateExerciseWeight, deleteSet, editSet };
}
