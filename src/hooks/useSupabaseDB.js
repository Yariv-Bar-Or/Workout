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

function showErrorToast(message) {
  if (typeof document === "undefined") return;
  const toast = document.createElement("div");
  toast.style.cssText = [
    "position:fixed", "bottom:80px", "right:16px", "z-index:9999",
    "background:#2a1515", "border:1px solid rgba(239,68,68,0.3)", "border-radius:10px",
    "padding:10px 16px", "color:#f87171", "font-size:13px",
    "direction:rtl", "box-shadow:0 4px 16px rgba(0,0,0,0.5)",
    "font-family:system-ui,-apple-system,sans-serif",
  ].join(";");
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
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
    const newSession = { id: genId(), weight, reps: reps || null, date: ts || now };
    let prev;
    setExercises(cur => {
      prev = cur;
      return cur.map(e => e.id !== exerciseId ? e : { ...e, sessions: [...e.sessions, newSession], updated_at: now });
    });
    if (navigator.onLine) {
      const { data, error } = await supabase.rpc('append_session', {
        p_exercise_id: exerciseId,
        p_session: newSession,
        p_updated_at: now,
      });
      if (error || data === 0) {
        setExercises(prev);
        showErrorToast('שגיאה בשמירת הסט. נסה שנית.');
      }
    } else {
      enqueue({
        id: genOfflineId(),
        type: 'append_session',
        payload: { exerciseId, session: newSession, userId: user.id, updatedAt: now },
        createdAt: now,
      }).catch(err => console.error('enqueue error:', err));
      showToast('נשמר באופן מקומי — יסונכרן כשהחיבור יחזור');
    }
  }, [user]);

  const deleteSet = useCallback(async (exerciseId, sessionId) => {
    if (!user) return;
    const now = Date.now();
    let prev;
    setExercises(cur => {
      prev = cur;
      return cur.map(e => e.id !== exerciseId ? e : { ...e, sessions: e.sessions.filter(s => s.id !== sessionId), updated_at: now });
    });
    const { data, error } = await supabase.rpc('delete_session', {
      p_exercise_id: exerciseId,
      p_session_id: sessionId,
      p_updated_at: now,
    });
    if (error || data === 0) {
      setExercises(prev);
      showErrorToast('שגיאה במחיקת הסט. נסה שנית.');
    }
  }, [user]);

  const editSet = useCallback(async (exerciseId, sessionId, weight, reps, ts) => {
    if (!user) return;
    const now = Date.now();
    let prev;
    setExercises(cur => {
      prev = cur;
      return cur.map(e => e.id !== exerciseId ? e : {
        ...e,
        sessions: e.sessions.map(s => s.id === sessionId ? { ...s, weight, reps: reps || null, date: ts } : s),
        updated_at: now,
      });
    });
    const { data, error } = await supabase.rpc('update_session', {
      p_exercise_id: exerciseId,
      p_session_id: sessionId,
      p_weight: weight,
      p_reps: reps || null,
      p_date: ts,
      p_updated_at: now,
    });
    if (error || data === 0) {
      setExercises(prev);
      showErrorToast('שגיאה בעדכון הסט. נסה שנית.');
    }
  }, [user]);

  const renameExercise = useCallback(async (exerciseId, newName) => {
    if (!user) return;
    const now = Date.now();
    let prev;
    setExercises(cur => {
      prev = cur;
      return cur.map(e => e.id === exerciseId ? { ...e, name: newName, updated_at: now } : e);
    });
    const { error } = await supabase.from('exercises')
      .update({ name: newName, updated_at: now })
      .eq('id', exerciseId)
      .eq('user_id', user.id);
    if (error) {
      setExercises(prev);
      showErrorToast('שגיאה בשמירת השם. נסה שנית.');
    }
  }, [user]);

  const deleteExercise = useCallback(async (exerciseId) => {
    if (!user) return;
    let prev;
    setExercises(cur => {
      prev = cur;
      return cur.filter(e => e.id !== exerciseId);
    });
    const { error } = await supabase.from('exercises')
      .delete()
      .eq('id', exerciseId)
      .eq('user_id', user.id);
    if (error) {
      setExercises(prev);
      showErrorToast('שגיאה במחיקת התרגיל. נסה שנית.');
    }
  }, [user]);

  return { exercises, loading, addExercise, updateExerciseWeight, deleteSet, editSet, renameExercise, deleteExercise };
}
