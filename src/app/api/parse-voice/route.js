import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { transcript, exercises } = await request.json();

  const exerciseList = exercises?.length
    ? exercises.map((e) => `- "${e.name}" (${e.category})`).join("\n")
    : "(no exercises yet)";

  const systemPrompt = `You are a workout logging assistant that parses Hebrew voice input into structured JSON.
The user may describe one or more sets in a single sentence. "ועוד סט" or "עוד סט" means another set.
"אותו דבר" or "אותו" means identical weight and reps to the previous set in the same sentence.
Return ONLY a valid JSON array of set objects. Each object has:
- exerciseName: string (match to user's exercise list if possible, otherwise best guess in English)
- muscleGroup: string (one of: chest, back, shoulders, biceps, triceps, legs)
- weight: number (kg, null if not mentioned)
- reps: number (repetitions, null if not mentioned)
- confidence: number (0 to 1)
No markdown, no code blocks, no explanation — just the raw JSON array.
If only one set is described, still return an array with one object.`;

  const userPrompt = `User's exercise list:
${exerciseList}

Hebrew voice transcript: "${transcript}"

Parse ALL sets mentioned. Resolve "אותו דבר" / "אותו" by copying weight and reps from the previous set in the same transcript.
Hebrew number words: אחד/אחת=1, שתיים/שניים=2, שלוש=3, ארבע=4, חמש=5, שש=6, שבע=7, שמונה=8, תשע=9, עשר=10, עשרים=20, שלושים=30, ארבעים=40, חמישים=50, שישים=60, שבעים=70, שמונים=80, תשעים=90, מאה=100.
"קילו" / "ק״ג" / "קג" = kg weight. "חזרות" / "פעמים" / "פעם" = reps.
Return a JSON array — one object per set, in the order they were mentioned.`;

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

  const groqData = await response.json();
  const content = groqData?.choices?.[0]?.message?.content ?? "{}";

  let sets;
  try {
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    sets = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return Response.json({ error: "parse error" }, { status: 500 });
  }

  // Validate each set
  const validatedSets = [];
  for (const set of sets) {
    let { weight, reps } = set;

    if (weight !== null && weight !== undefined) {
      if (typeof weight === "string") weight = Number(weight);
      if (typeof weight !== "number" || isNaN(weight) || weight <= 0 || weight > 500) {
        return Response.json({ error: "invalid_value", field: "weight" }, { status: 422 });
      }
    }

    if (reps !== null && reps !== undefined) {
      if (typeof reps === "string") reps = Number(reps);
      if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
        return Response.json({ error: "invalid_value", field: "reps" }, { status: 422 });
      }
    }

    validatedSets.push({ ...set, weight, reps });
  }

  return Response.json({ sets: validatedSets });
}
