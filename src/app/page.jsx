"use client";

import { useAuth } from "../hooks/useAuth";
import AuthScreen from "../components/AuthScreen";
import WorkoutTracker from "../components/WorkoutTracker";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Page() {
  const { user, session, loading, needsName } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LoadingSpinner />
    </div>
  );

  if (!session || needsName) return <AuthScreen />;

  return <WorkoutTracker user={user} />;
}
