import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { SANITY_PROJECT_ID } from "@/sanity/env";
import { accessToken } from "./auth";
import { getSupabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";

// Who may open the admin dashboard (/admin, the Sanity studio). Anyone can
// log in at For Work (/work) with Google, GitHub or email, but only the OGCW
// GitHub account gets admin access; every other account is a normal reader.
// The server decides, from the login itself (not from anything the browser
// says), and Sanity checks again: only members of the OGCW Sanity project
// can change anything in it.

/** The OGCW GitHub account (github.com/Zinjabeel), by its permanent id */
const OWNER_GITHUB_ID = "285679964";

export type WorkAccess = "admin" | "member" | "guest";

/** Ask the server what the account behind this login may do */
export const checkWorkAccess = createServerFn({ method: "POST" })
  .validator((token: unknown) => {
    if (typeof token !== "string" || token.length < 20 || token.length > 8000) throw new Error("Not a login");
    return token;
  })
  .handler(async ({ data }): Promise<WorkAccess> => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    // Supabase checks the login is real and current, and says who it belongs to
    const { data: result, error } = await supabase.auth.getUser(data);
    if (error || !result.user) return "guest";
    const owner = (result.user.identities ?? []).some((identity) => {
      if (identity.provider !== "github") return false;
      const info = identity.identity_data ?? {};
      return [info["provider_id"], info["sub"], identity.id].some((id) => String(id ?? "") === OWNER_GITHUB_ID);
    });
    return owner ? "admin" : "member";
  });

// The answers, kept for as long as the same login lasts (each page's header asks)
const answers = new Map<string, Promise<boolean | WorkAccess>>();
const once = <T extends boolean | WorkAccess>(key: string, ask: () => Promise<T>) => {
  if (!answers.has(key)) answers.set(key, ask().catch((error: unknown) => { answers.delete(key); throw error; }));
  return answers.get(key) as Promise<T>;
};

/** Whether this browser is logged in to the OGCW Sanity project as one of its members */
async function sanityMember() {
  let token: string | null = null;
  try {
    token = JSON.parse(localStorage.getItem(`__studio_auth_token_${SANITY_PROJECT_ID}`) ?? "null")?.token ?? null;
  } catch {
    return false;
  }
  if (!token) return false;
  return once(`sanity:${token}`, async () => {
    // Only the project's members can see its details
    const response = await fetch(`https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}`, { headers: { Authorization: `Bearer ${token}` } });
    return response.ok;
  }).catch(() => false);
}

/** What the OGCW account logged in here may do, as the server sees it */
async function accountAccess(): Promise<WorkAccess> {
  const token = await accessToken().catch(() => null);
  if (!token) return "guest";
  return once(`account:${token}`, () => checkWorkAccess({ data: token })).catch((): WorkAccess => "member");
}

/** Admin when the OGCW GitHub account is logged in here, or a member of the Sanity project is */
export async function adminAccess(): Promise<boolean> {
  return (await accountAccess()) === "admin" || sanityMember();
}

/** What the person on this page may do: re-checked whenever they log in or out */
export function useWorkAccess() {
  const [access, setAccess] = useState<WorkAccess | "checking">("checking");
  useEffect(() => {
    let current = true;
    const check = async () => {
      const result = await accountAccess();
      if (current) setAccess(result === "admin" || (await sanityMember()) ? "admin" : result);
    };
    void check();
    const { data } = getSupabase().auth.onAuthStateChange(() => { void check(); });
    return () => {
      current = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return access;
}
