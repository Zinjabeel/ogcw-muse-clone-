import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// OGCW's Supabase project ("One great culture world", EU / Frankfurt), which
// runs reader accounts. The publishable key is meant to be public: it only
// allows what the project's settings and row-level security allow.
export const SUPABASE_URL = "https://dkzjgjerfaxtjyeixpqe.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_O40ZHX86w6GatKyosuDW7w_rD9Iosp3";

let client: SupabaseClient | null = null;

/**
 * Supabase in the browser, for public things only: reading the forum, the
 * poll and rating counts, the newsletter sign-up. It never holds a login:
 * logins are kept by the server (src/lib/server/session.server.ts), and
 * anything done as an account goes through the server.
 */
export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("Supabase is only used in the browser.");
  client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
