import { createClient } from "@supabase/supabase-js";
import { secureStorage } from "@/lib/secureStorage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  "";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  isValidHttpUrl(supabaseUrl) &&
  !supabaseUrl.includes("your_supabase") &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes("your_supabase");

export const missingSupabaseConfigMessage =
  "FITNEO is missing its Supabase production configuration. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Vercel, enable Production/Preview/Development, then redeploy with a clean cache.";

export const supabaseConfigStatus = {
  isConfigured: isSupabaseConfigured,
  hasUrl: isValidHttpUrl(supabaseUrl) && !supabaseUrl.includes("your_supabase"),
  hasAnonKey: supabaseAnonKey.length > 0 && !supabaseAnonKey.includes("your_supabase")
};

const clientUrl = isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co";
const clientAnonKey = isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key";
export const supabase = createClient(clientUrl, clientAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
