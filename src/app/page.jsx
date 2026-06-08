"use client";

import { useAuth } from "../hooks/useAuth";
import AuthScreen from "../components/AuthScreen";
import WorkoutTracker from "../components/WorkoutTracker";

export default function Page() {
  const { user, session, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6b35", fontSize: 18 }}>
      טוען...
    </div>
  );

  if (!session) return <AuthScreen />;

  return <WorkoutTracker user={user} />;
}
