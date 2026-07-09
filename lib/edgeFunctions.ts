import { supabase } from "@/lib/supabase";
import { fetch as expoFetch } from "expo/fetch";

export const FITNEO_EDGE_FUNCTION = "fitneo-ai-coach";
const REQUEST_TIMEOUT_MS = 30_000;
const RETRYABLE_ERROR_PATTERN = /high demand|overload|rate limit|resource exhausted|timeout|temporarily unavailable|503|429/i;

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableAiError(error: string | null | undefined) {
  return Boolean(error && RETRYABLE_ERROR_PATTERN.test(error));
}

function friendlyAiError(error: string | null | undefined) {
  if (isRetryableAiError(error)) {
    return "FITNEO AI is seeing high demand right now. Your message is safe — wait a moment and try again.";
  }
  return error ?? "FITNEO AI could not respond.";
}

function normalizeBase64Image(imageUri: string) {
  const trimmed = imageUri.trim();
  const match = trimmed.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/s);
  const mimeType = match?.[1]?.replace("image/jpg", "image/jpeg") ?? "image/jpeg";
  const rawBase64 = (match?.[2] ?? trimmed).replace(/\s/g, "");

  if (!rawBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(rawBase64)) {
    throw new Error("The camera image could not be encoded for AI analysis. Please retake the photo.");
  }

  return {
    dataUri: `data:${mimeType};base64,${rawBase64}`,
    imageData: rawBase64,
    mimeType
  };
}

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
      return { data: null, error: friendlyAiError(error instanceof Error ? error.message : "FITNEO AI timed out.") };
    }
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
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
      let errorMessage = detail || `FITNEO AI returned HTTP ${response.status}.`;
      try {
        const parsed = JSON.parse(detail) as { error?: string; message?: string };
        errorMessage = parsed.error ?? parsed.message ?? errorMessage;
      } catch {
        // Keep the text response.
      }
      if (attempt === 0 && isRetryableAiError(errorMessage)) {
        await delay(900);
        continue;
      }
      return { data: null, error: friendlyAiError(errorMessage) };
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "FITNEO AI timed out.";
      if (attempt === 0 && isRetryableAiError(errorMessage)) {
        await delay(900);
        continue;
      }
      try {
        return await withTimeout(askFitneoCoach(prompt, options), 20_000);
      } catch (fallbackError) {
        return {
          data: null,
          error: friendlyAiError(fallbackError instanceof Error ? fallbackError.message : errorMessage)
        };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    return await withTimeout(askFitneoCoach(prompt, options), 20_000);
  } catch (error) {
    return { data: null, error: friendlyAiError(error instanceof Error ? error.message : "FITNEO AI timed out.") };
  }
}

export async function askFitneoCoachWithRetry(
  prompt: string,
  options: {
    sessionId?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    onChunk: (completeText: string) => void;
  },
  attempts = 2
) {
  let lastError: string | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await streamFitneoCoach(prompt, options);
      if (!response.error && response.data?.message) {
        return response;
      }
      lastError = response.error;
      if (!isRetryableAiError(lastError) || attempt === attempts - 1) {
        return { data: null, error: friendlyAiError(lastError) };
      }
      await delay(1000 * (attempt + 1));
    } catch (error) {
      lastError = error instanceof Error ? error.message : "FITNEO AI could not respond.";
      if (!isRetryableAiError(lastError) || attempt === attempts - 1) {
        return { data: null, error: friendlyAiError(lastError) };
      }
      await delay(1000 * (attempt + 1));
    }
  }
  return { data: null, error: friendlyAiError(lastError) };
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
  let normalizedImage;
  try {
    normalizedImage = normalizeBase64Image(imageUri);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "The camera image could not be encoded."
    };
  }

  const response = await callEdgeFunction<
    { task: "food-scan"; prompt: string; imageUri: string; image_data: string; mimeType: string },
    FoodScanResult
  >(
    FITNEO_EDGE_FUNCTION,
    {
      task: "food-scan",
      prompt: "Identify this meal and estimate nutrition for the visible serving.",
      imageUri: normalizedImage.dataUri,
      image_data: normalizedImage.imageData,
      mimeType: normalizedImage.mimeType
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
