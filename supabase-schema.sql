-- ─── Iron Log · Supabase Schema ───────────────────────────────────────────
-- Run this in your Supabase SQL Editor

-- 1. Profiles table (max 10 rows enforced by app logic)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Exercises table
CREATE TABLE exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN ('push', 'pull', 'legs')),
  name        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Sessions table (each logged workout is a row)
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight      NUMERIC(6,2) NOT NULL,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX sessions_exercise_id_logged ON sessions(exercise_id, logged_at DESC);
CREATE INDEX exercises_profile_cat ON exercises(profile_id, category);

-- ─── Public access (no auth) ─────────────────────────────────────────────────
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON profiles  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON sessions  FOR ALL USING (true) WITH CHECK (true);

-- ─── Seed standard exercises for a profile (call after creating profile) ────
-- INSERT INTO exercises (profile_id, category, name) VALUES
--   ($1, 'push', 'Bench Press'), ($1, 'push', 'Overhead Press'), ($1, 'push', 'Incline Press'), ($1, 'push', 'Tricep Dips'),
--   ($1, 'pull', 'Pull-ups'), ($1, 'pull', 'Rows'), ($1, 'pull', 'Lat Pulldown'), ($1, 'pull', 'Face Pulls'),
--   ($1, 'legs', 'Squats'), ($1, 'legs', 'Deadlifts'), ($1, 'legs', 'Leg Press'), ($1, 'legs', 'Lunges');


-- ═══════════════════════════════════════════════════════════════════════════
-- INTEGRATION GUIDE — replace localStorage calls in workout-tracker.jsx
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Install & init ────────────────────────────────────────────────────────
-- npm install @supabase/supabase-js
--
-- import { createClient } from "@supabase/supabase-js";
-- const supabase = createClient(
--   process.env.NEXT_PUBLIC_SUPABASE_URL,
--   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
-- );

-- ── 2. Load profiles (sorted by updated_at desc) ─────────────────────────────
-- const { data: profiles } = await supabase
--   .from("profiles")
--   .select("*")
--   .order("updated_at", { ascending: false })
--   .limit(10);

-- ── 3. Add profile + seed exercises ─────────────────────────────────────────
-- const { data: profile } = await supabase
--   .from("profiles").insert({ name }).select().single();
-- await supabase.from("exercises").insert(
--   SEED.flatMap(([cat, names]) => names.map(name => ({ profile_id: profile.id, category: cat, name })))
-- );

-- ── 4. Load exercises for a category ─────────────────────────────────────────
-- const { data: exercises } = await supabase
--   .from("exercises")
--   .select("*, sessions(weight, logged_at)")
--   .eq("profile_id", profileId)
--   .eq("category", category)
--   .order("updated_at", { ascending: false });

-- ── 5. Log a session (optimistic update pattern) ──────────────────────────────
-- // 1. Update local state immediately (optimistic)
-- setExercises(exs => exs.map(e => e.id === exId
--   ? { ...e, sessions: [...e.sessions, { weight, logged_at: new Date() }] }
--   : e
-- ));
-- // 2. Persist to Supabase
-- await supabase.from("sessions").insert({ exercise_id: exId, weight });
-- // 3. Bump updated_at on exercise + profile
-- await supabase.from("exercises").update({ updated_at: new Date() }).eq("id", exId);
-- await supabase.from("profiles").update({ updated_at: new Date() }).eq("id", profileId);
-- // 4. Rollback on error
-- .catch(() => setExercises(original));

-- ── 6. Real-time sync (multi-device) ─────────────────────────────────────────
-- supabase
--   .channel("sessions")
--   .on("postgres_changes", { event: "INSERT", schema: "public", table: "sessions" },
--     (payload) => {
--       // merge new session into local state
--       setExercises(exs => exs.map(e =>
--         e.id === payload.new.exercise_id
--           ? { ...e, sessions: [...e.sessions, payload.new] }
--           : e
--       ));
--     }
--   )
--   .subscribe();

-- ── 7. .env.local ─────────────────────────────────────────────────────────────
-- NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
