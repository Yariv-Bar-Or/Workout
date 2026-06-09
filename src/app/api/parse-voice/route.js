export async function POST(request) {
  const { transcript, exercises } = await request.json();

  const exerciseList = exercises?.length
    ? exercises.map((e) => `- "${e.name}" (${e.category})`).join("\n")
    : "(no exercises yet)";

  const systemPrompt = `You are a workout logging assistant that parses Hebrew voice input into structured JSON.
Return ONLY a valid JSON object with these exact fields:
- exerciseName: string (exact name from the user's exercise list if matched, otherwise your best guess in English)
- muscleGroup: string (one of: chest, back, shoulders, biceps, triceps, legs)
- weight: number (kg, null if not mentioned)
- reps: number (repetitions, null if not mentioned)
- confidence: number (0 to 1)
No markdown, no code blocks, no explanation — just the raw JSON object.`;

  const userPrompt = `User's exercise list:
${exerciseList}

Hebrew voice transcript: "${transcript}"

Parse the transcript. Match exerciseName to the exact name from the user's exercise list when possible.
Hebrew number words: אחד/אחת=1, שתיים/שניים=2, שלוש=3, ארבע=4, חמש=5, שש=6, שבע=7, שמונה=8, תשע=9, עשר=10, עשרים=20, שלושים=30, ארבעים=40, חמישים=50, שישים=60, שבעים=70, שמונים=80, תשעים=90, מאה=100.
"קילו" / "ק״ג" = kg weight. "חזרות" / "פעמים" / "פעם" = reps.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "שגיאה בשרת" }, { status: 500 });
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";

  try {
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return Response.json(JSON.parse(cleaned));
  } catch {
    return Response.json({ error: "parse error" }, { status: 500 });
  }
}
