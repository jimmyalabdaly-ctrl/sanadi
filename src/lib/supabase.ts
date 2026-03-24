import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Browser client — for realtime subscriptions in React components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server/admin client — for storage uploads in API routes (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

export const STORAGE_BUCKET = "uploads";

export const STORAGE_FOLDERS = {
  avatars: "avatars",
  portfolios: "portfolios",
  verifications: "verifications",
  requests: "requests",
  reviews: "reviews",
} as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS];

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
