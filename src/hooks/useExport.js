"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORY_LABELS = {
  chest:     "חזה",
  back:      "גב",
  shoulders: "כתפיים",
  biceps:    "יד קדמית",
  triceps:   "יד אחורית",
  legs:      "רגליים",
};

function formatDate(ts) {
  return new Date(ts).toISOString().split("T")[0];
}

function escapeCSV(val) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function useExport(user) {
  const [isExporting, setIsExporting] = useState(false);

  async function exportToCSV() {
    if (!user) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: true });

      if (error) throw error;

      const headers = ["תאריך", "שריר", "תרגיל", "סט", 'משקל (ק"ג)', "חזרות"];
      const rows = [headers.map(escapeCSV).join(",")];

      for (const exercise of (data || [])) {
        const muscleLabel = CATEGORY_LABELS[exercise.category] || exercise.category;
        const sortedSessions = [...(exercise.sessions || [])].sort((a, b) => a.date - b.date);
        sortedSessions.forEach((session, i) => {
          rows.push([
            formatDate(session.date),
            muscleLabel,
            exercise.name,
            i + 1,
            session.weight,
            session.reps ?? "",
          ].map(escapeCSV).join(","));
        });
      }

      const csv = "﻿" + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `liftlog-export-${formatDate(Date.now())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[useExport] error:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return { exportToCSV, isExporting };
}
