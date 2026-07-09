import { supabase } from "@/lib/supabase";
import { fetch as expoFetch } from "expo/fetch";

export const FITNEO_EDGE_FUNCTION = "fitneo-ai-coach";
const REQUEST_TIMEOUT_MS = 30_000;

async function withTimeout<T>(promise: Promise<T>, milliseconds = REQUEST_TIMEOUT_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("The FITNEO AI request timed out. Please try again.")), milliseconds);
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

type FunctionResponse<T> = {
  data: T | null;
  error: string | null;
};

export async function callEdgeFunction<TPayload extends Record<string, unknown>, TResult>(
  name: string,
  payload: TPayload
): Promise<FunctionResponse<TResult>> {
  const { data, error } = await supabase.functions.invoke<TResult>(name, {
    body: payload
  });

  if (error) {
    let detail = error.message;
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const body = await context.clone().json() as { error?: string; message?: string };
        detail = body.error ?? body.message ?? detail;
      } catch {
        try {
          detail = (await context.clone().text()) || detail;
        } catch {
          // Preserve the Supabase error message when the response body is unavailable.
        }
      }
    }
    return { data: null, error: detail };
  }

  return { data: data ?? null, error: null };
}

export async function askFitneoCoach(
  prompt: string,
  options?: {
    sessionId?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  }
) {
  const history = options?.history ?? [];
  const response = await callEdgeFunction<
    {
      prompt: string;
      message: string;
      sessionId?: string;
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    },
    { message?: string; response?: string; content?: string; text?: string }
  >(FITNEO_EDGE_FUNCTION, {
    prompt,
    message: prompt,
    sessionId: options?.sessionId,
    messages: [...history, { role: "user", content: prompt }]
  });

  if (response.error || !response.data) {
    return { data: null, error: response.error };
  }

  const message =
    response.data.message ??
    response.data.response ??
    response.data.content ??
    response.data.text ??
    null;
  return {
    data: message ? { message } : null,
    error: message ? null : "The AI function returned an empty response."
  };
}

export async function streamFitneoCoach(
  prompt: string,
  options: {
    sessionId?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    onChunk: (completeText: string) => void;
  }
) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!supabaseUrl || !anonKey || !token) {
    try {
      return await withTimeout(askFitneoCoach(prompt, options));
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "FITNEO AI timed out." };
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await expoFetch(`${supabaseUrl}/functions/v1/${FITNEO_EDGE_FUNCTION}`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        message: prompt,
        sessionId: options.sessionId,
        messages: [...(options.history ?? []), { role: "user", content: prompt }]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text();
      try {
        const parsed = JSON.parse(detail) as { error?: string; message?: string };
        return { data: null, error: parsed.error ?? parsed.message ?? detail };
      } catch {
        return { data: null, error: detail || `FITNEO AI returned HTTP ${response.status}.` };
      }
    }

    if (!response.body) {
      return askFitneoCoach(prompt, options);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completeText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) {
          continue;
        }
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") {
          continue;
        }
        try {
          const event = JSON.parse(raw) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const chunk = event.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("") ?? "";
          if (chunk) {
            completeText += chunk;
            options.onChunk(completeText);
          }
        } catch {
          // Keep reading when the provider sends a non-content SSE event.
        }
      }
    }

    const result = completeText
      ? { data: { message: completeText }, error: null }
      : { data: null, error: "FITNEO AI finished without returning content." };
    return result;
  } catch {
    try {
      return await withTimeout(askFitneoCoach(prompt, options), 20_000);
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "FITNEO AI timed out." };
    }
  } finally {
    clearTimeout(timeout);
  }
}

export type FoodScanResult = {
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
};

export async function analyzeFoodPhoto(imageUri: string) {
  const response = await callEdgeFunction<
    { task: "food-scan"; prompt: string; imageUri: string },
    FoodScanResult
  >(
    FITNEO_EDGE_FUNCTION,
    {
      task: "food-scan",
      prompt: "Identify this meal and estimate nutrition for the visible serving.",
      imageUri
    }
  );
  const result = response.data;
  if (response.error || !result) {
    return response;
  }
  if (
    typeof result.foodName !== "string" ||
    typeof result.calories !== "number" ||
    typeof result.protein !== "number" ||
    typeof result.carbs !== "number" ||
    typeof result.fat !== "number"
  ) {
    return {
      data: null,
      error: "The deployed FITNEO scanner needs the latest Edge Function update before image analysis can run."
    };
  }
  return response;
}
