"use client";
import { useState, useCallback, useMemo } from "react";

function isToday(dateMs) {
  const d = new Date(dateMs);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function useShareCard(exercises) {
  const [isGenerating, setIsGenerating] = useState(false);

  const summary = useMemo(() => {
    const todayExercises = exercises
      .map((ex) => {
        const todaySessions = ex.sessions.filter((s) => isToday(s.date));
        if (!todaySessions.length) return null;

        const allTimeBest = ex.sessions.reduce((m, s) => Math.max(m, s.weight), 0);
        const todayBest = todaySessions.reduce((m, s) => Math.max(m, s.weight), 0);
        const bestSession = todaySessions.find((s) => s.weight === todayBest);
        const volumeToday = todaySessions.reduce(
          (sum, s) => sum + s.weight * (s.reps ?? 1),
          0
        );

        return {
          id: ex.id,
          name: ex.name,
          bestWeight: todayBest,
          bestReps: bestSession?.reps ?? null,
          isPR: todayBest === allTimeBest,
          volumeToday,
        };
      })
      .filter(Boolean);

    const totalVolume = todayExercises.reduce((sum, e) => sum + e.volumeToday, 0);
    return { todayExercises, totalVolume };
  }, [exercises]);

  const hasWorkoutToday = summary.todayExercises.length > 0;

  const generateCard = useCallback(async () => {
    if (!hasWorkoutToday) return;
    setIsGenerating(true);

    try {
      const { todayExercises, totalVolume } = summary;
      const now = new Date();
      const W = 1080;
      const H = 1920;
      const PAD = 80;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0a0a0a");
      grad.addColorStop(1, "#1a1a1a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.direction = "rtl";
      ctx.textAlign = "right";

      let y = PAD;

      // ── Title ──────────────────────────────────────────────────
      ctx.save();
      ctx.font = "bold 64px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("🏋️ LiftLog", W - PAD, y + 64);
      ctx.restore();
      y += 90;

      // ── Date ───────────────────────────────────────────────────
      const dateStr = now.toLocaleDateString("he-IL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      ctx.save();
      ctx.font = "36px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText(dateStr, W - PAD, y + 36);
      ctx.restore();
      y += 70;

      // ── Orange divider ─────────────────────────────────────────
      ctx.save();
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
      ctx.restore();
      y += 60;

      // ── Exercise list ──────────────────────────────────────────
      const shown = todayExercises.slice(0, 6);
      const extra = todayExercises.length - 6;

      for (const ex of shown) {
        ctx.save();

        // Name in white (trophy emoji appended for PR exercises)
        const nameText = ex.isPR ? `${ex.name} 🏆` : ex.name;
        ctx.font = "bold 44px system-ui, -apple-system, Arial, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(nameText, W - PAD, y + 44);

        // Orange "שיא אישי!" badge positioned to the left of the name
        if (ex.isPR) {
          const nameWidth = ctx.measureText(nameText).width;
          ctx.font = "bold 32px system-ui, -apple-system, Arial, sans-serif";
          ctx.fillStyle = "#f97316";
          ctx.fillText("שיא אישי!", W - PAD - nameWidth - 16, y + 44);
        }

        y += 60;

        // Weight × reps in gray
        const weightStr =
          ex.bestReps != null
            ? `${ex.bestWeight} ק״ג × ${ex.bestReps} חזרות`
            : `${ex.bestWeight} ק״ג`;
        ctx.font = "36px system-ui, -apple-system, Arial, sans-serif";
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText(weightStr, W - PAD, y + 36);
        y += 56;

        ctx.restore();
        y += 14;
      }

      if (extra > 0) {
        ctx.save();
        ctx.font = "36px system-ui, -apple-system, Arial, sans-serif";
        ctx.fillStyle = "#666666";
        ctx.fillText(`+ ${extra} נוספים`, W - PAD, y + 36);
        ctx.restore();
        y += 70;
      }

      y += 60;

      // ── Gray divider ───────────────────────────────────────────
      ctx.save();
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
      ctx.restore();
      y += 60;

      // ── Volume label ───────────────────────────────────────────
      ctx.save();
      ctx.font = "36px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText("💪 נפח כולל היום:", W - PAD, y + 36);
      ctx.restore();
      y += 80;

      // ── Volume number + ק״ג unit ───────────────────────────────
      ctx.save();
      const volStr = Math.round(totalVolume).toLocaleString("he-IL");
      ctx.font = "bold 72px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(volStr, W - PAD, y + 72);

      // Unit drawn to the left of the number
      const volNumWidth = ctx.measureText(volStr).width;
      ctx.font = "48px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#f97316";
      ctx.fillText('ק״ג', W - PAD - volNumWidth - 16, y + 70);
      ctx.restore();
      y += 110;

      // ── Footer ─────────────────────────────────────────────────
      ctx.save();
      ctx.font = "28px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#555555";
      ctx.fillText("תועד עם LiftLog", W - PAD, y + 28);
      ctx.restore();

      // ── Export / share ─────────────────────────────────────────
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const fileName = `liftlog-workout-${now.toISOString().split("T")[0]}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "האימון שלי - LiftLog",
          text: `אימון של ${dateStr}`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Share card error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [summary, hasWorkoutToday]);

  return { generateCard, isGenerating, hasWorkoutToday };
}
