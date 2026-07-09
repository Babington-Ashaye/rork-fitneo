import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

type ChatRole = "user" | "assistant";

type CoachRequest = {
  task?: "coach" | "food-scan";
  prompt?: string;
  message?: string;
  imageUri?: string;
  image_data?: string;
  imageData?: string;
  mimeType?: string;
  sessionId?: string;
  messages?: Array<{
    role?: ChatRole;
    content?: string;
  }>;
};

const systemInstruction = `
You are FITNEO AI, a concise and highly practical fitness coach.
Use the athlete's message and conversation history to provide safe, actionable guidance.
When asked to create a workout, return a structured routine with:
- session title and goal
- warm-up
- 4 to 8 exercises with sets, reps or duration, and rest
- cooldown
- one progression rule
Never diagnose medical conditions. For pain, injury, pregnancy, medication, or eating-disorder
concerns, recommend an appropriate qualified professional. Avoid extreme calorie deficits,
punishment language, and guaranteed outcomes.
`.trim();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json({ error: "GEMINI_API_KEY is not configured for fitneo-ai-coach." }, 500);
  }

  let payload: CoachRequest;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const prompt = (payload.prompt ?? payload.message ?? "").trim();
  if (!prompt) {
    return json({ error: "A non-empty prompt is required." }, 400);
  }

  if (payload.task === "food-scan") {
    return analyzeFood(payload, apiKey);
  }

  const history = (payload.messages ?? [])
    .filter((message) => message.content?.trim())
    .slice(-20)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content!.trim() }]
    }));

  if (
    history.length === 0 ||
    history[history.length - 1].role !== "user" ||
    history[history.length - 1].parts[0].text !== prompt
  ) {
    history.push({ role: "user", parts: [{ text: prompt }] });
  }

  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash";
  const wantsStream = request.headers.get("accept")?.includes("text/event-stream") ?? false;
  const action = wantsStream ? "streamGenerateContent?alt=sse" : "generateContent";
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${action}`;

  try {
    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: history,
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 1800
        }
      })
    });

    if (!geminiResponse.ok) {
      const responseBody = await geminiResponse.json();
      const detail =
        responseBody?.error?.message ??
        `Gemini returned HTTP ${geminiResponse.status}.`;
      return json({ error: detail }, geminiResponse.status);
    }

    if (wantsStream && geminiResponse.body) {
      return new Response(geminiResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "no-cache",
          "Content-Type": "text/event-stream"
        }
      });
    }

    const responseBody = await geminiResponse.json();
    const message = responseBody?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!message) {
      return json({ error: "Gemini returned no coaching content." }, 502);
    }

    return json({
      message,
      sessionId: payload.sessionId ?? null,
      model
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error
          ? `FITNEO AI request failed: ${error.message}`
          : "FITNEO AI request failed."
      },
      502
    );
  }
});

async function analyzeFood(payload: CoachRequest, apiKey: string) {
  const normalized = normalizeFoodImage(payload);
  if (!normalized) {
    return json({ error: "A JPEG, PNG, or WebP base64 image is required." }, 400);
  }

  const model = Deno.env.get("GEMINI_VISION_MODEL") ?? Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            {
              text: "Identify the visible meal and estimate nutrition for the full visible serving. Return conservative estimates. Output JSON only."
            },
            {
              inlineData: {
                mimeType: normalized.mimeType,
                data: normalized.data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            required: ["foodName", "servingSize", "calories", "protein", "carbs", "fat"],
            properties: {
              foodName: { type: "STRING" },
              servingSize: { type: "STRING" },
              calories: { type: "NUMBER" },
              protein: { type: "NUMBER" },
              carbs: { type: "NUMBER" },
              fat: { type: "NUMBER" },
              confidence: { type: "NUMBER" }
            }
          }
        }
      })
    });

    const body = await response.json();
    if (!response.ok) {
      return json({ error: body?.error?.message ?? `Gemini returned HTTP ${response.status}.` }, response.status);
    }
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return json({ error: "The meal image could not be analyzed." }, 502);
    }
    const result = JSON.parse(text);
    return json({
      foodName: String(result.foodName ?? "Scanned meal"),
      servingSize: String(result.servingSize ?? "1 serving"),
      calories: Math.max(0, Number(result.calories ?? 0)),
      protein: Math.max(0, Number(result.protein ?? 0)),
      carbs: Math.max(0, Number(result.carbs ?? 0)),
      fat: Math.max(0, Number(result.fat ?? 0)),
      confidence: Math.min(1, Math.max(0, Number(result.confidence ?? 0.75)))
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? `Food analysis failed: ${error.message}` : "Food analysis failed."
    }, 502);
  }
}

function normalizeFoodImage(payload: CoachRequest): { mimeType: string; data: string } | null {
  const dataUri = payload.imageUri?.trim() ?? "";
  const match = dataUri.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/s);
  const mimeType = (payload.mimeType ?? match?.[1] ?? "image/jpeg").replace("image/jpg", "image/jpeg");
  const base64 = (payload.image_data ?? payload.imageData ?? match?.[2] ?? "").replace(/\s/g, "");

  if (!/^image\/(?:jpeg|png|webp)$/.test(mimeType)) {
    return null;
  }
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return null;
  }
  try {
    atob(base64);
  } catch {
    return null;
  }
  return { mimeType, data: base64 };
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
