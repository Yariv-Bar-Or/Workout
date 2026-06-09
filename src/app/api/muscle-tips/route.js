const exercisePool = {
  chest: ["Incline Dumbbell Press", "Decline Push-Up", "Dumbbell Pullover", "Pec Deck Machine", "Low Cable Crossover", "High Cable Crossover", "Landmine Press", "Svend Press", "Dumbbell Floor Press", "Wide Push-Up", "Dips", "Incline Cable Fly", "Smith Machine Press", "Single Arm Cable Fly", "Push-Up with Rotation", "Resistance Band Fly", "TRX Push-Up", "Hex Press", "Dumbbell Squeeze Press", "Archer Push-Up"],
  back: ["Pendlay Row", "Single Arm Dumbbell Row", "Chest Supported Row", "Meadows Row", "Cable Pullover", "Straight Arm Pulldown", "Incline Dumbbell Row", "Seal Row", "Renegade Row", "Face Pull", "Banded Pull Apart", "TRX Row", "Underhand Barbell Row", "Rack Pull", "Dumbbell Shrug", "Cable Row with Rotation", "Lat Pulldown Close Grip", "Decline Dumbbell Row", "Kroc Row", "Half Kneeling Cable Row"],
  shoulders: ["Arnold Press", "Landmine Lateral Raise", "Cable Lateral Raise", "Seated Dumbbell Press", "Upright Row", "Plate Front Raise", "W-Press", "Band Pull Apart", "Prone Y-T-W", "Dumbbell Cuban Press", "Single Arm Cable Press", "Push Press", "Barbell Front Raise", "Machine Shoulder Press", "Dumbbell Lateral Raise", "Kneeling Cable Fly", "Behind the Neck Press", "Dumbbell High Pull", "Leaning Lateral Raise", "Bottoms Up KB Press"],
  biceps: ["Hammer Curl", "Incline Dumbbell Curl", "Concentration Curl", "Cable Curl", "Zottman Curl", "Preacher Curl", "Spider Curl", "Cross Body Curl", "Reverse Curl", "21s", "Banded Curl", "Single Arm Cable Curl", "Drag Curl", "Overhead Cable Curl", "Bayesian Curl", "TRX Curl", "Dumbbell Supinating Curl", "Barbell Curl", "Machine Curl", "Waiter Curl"],
  triceps: ["Skull Crusher", "Overhead Dumbbell Extension", "Cable Overhead Extension", "Diamond Push-Up", "Close Grip Bench Press", "Tricep Kickback", "Single Arm Cable Pushdown", "Rope Pushdown", "Tate Press", "JM Press", "Bench Dip", "EZ Bar Pushdown", "Dumbbell Tate Press", "Cable Crossover Pushdown", "Reverse Grip Pushdown", "Overhead Rope Extension", "Lying Cable Extension", "Machine Tricep Press", "Banded Pushdown", "Floor Press"],
  legs: ["Hack Squat", "Leg Press", "Romanian Deadlift", "Walking Lunge", "Goblet Squat", "Leg Curl", "Leg Extension", "Box Squat", "Sumo Deadlift", "Sissy Squat", "Nordic Curl", "Cable Pull Through", "Single Leg Press", "Reverse Lunge", "Glute Bridge", "Hip Thrust", "Step Up", "Cyclist Squat", "Good Morning", "Calf Raise"],
};

const muscleGroupKeyMap = {
  חזה: "chest",
  גב: "back",
  כתפיים: "shoulders",
  "יד קדמית": "biceps",
  "יד אחורית": "triceps",
  רגליים: "legs",
};

export async function POST(request) {
  const { muscleGroup } = await request.json();

  const systemPrompt = `You are a highly certified professional fitness trainer with deep expertise in anatomy, biomechanics, and training program design. Your answers are accurate, detailed, and based on proven scientific principles. Always respond entirely in Hebrew. Do not translate exercise names to Hebrew — keep them in their original English (e.g. "Fly", "Bench Press", "Squat"). Use professional Hebrew fitness terminology for everything else. Never use awkward literal translations.`;

  const poolKey = muscleGroupKeyMap[muscleGroup] || Object.keys(exercisePool).find(k => muscleGroup.toLowerCase().includes(k)) || "chest";
  const pool = exercisePool[poolKey];
  const exercise = pool[Math.floor(Math.random() * pool.length)];

  const prompt = `Explain the exercise "${exercise}" for the ${muscleGroup} muscle group. Respond entirely in Hebrew. Use the following exact structure:

**שם התרגיל**
${exercise}

**הסבר כללי**
[Explain the exercise, which muscles it activates, and what it develops physiologically]

**הוראות ביצוע**
[Numbered steps for correct execution]

**נקודות חשובות למניעת פציעה**
[Critical safety warnings and injury-prevention cues]`;

  console.log('[muscle-tips] GROQ_API_KEY set:', !!process.env.GROQ_API_KEY, '| length:', process.env.GROQ_API_KEY?.length);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
    }),
  });

  console.log('[muscle-tips] Groq response status:', response.status, response.statusText);

  if (!response.ok) {
    const errBody = await response.text();
    console.log('[muscle-tips] Groq error body:', errBody);
    return Response.json({ error: "שגיאה בשרת" }, { status: 500 });
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "לא ניתן לקבל תשובה כרגע.";

  return Response.json({ result: text });
}
