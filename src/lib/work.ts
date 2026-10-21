import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { SANITY_PROJECT_ID } from "@/sanity/env";
import { accessToken } from "./auth";
import { passwordAdminLogin } from "./admin-password";
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
    token = JSON.parse(localStorage.getItem(STUDIO_TOKEN_KEY) ?? "null")?.token ?? null;
  } catch {
    return false;
  }
  if (!token) return false;
  return once(`sanity:${token}`, async () => {
    // Only the project's members can see its details
    const headers = { Authorization: `Bearer ${token}` };
    const response = await fetch(`https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}`, { headers });
    if (response.ok) return true;
    // The admin password's key (a studio key, not a person) isn't shown the
    // project's details, but Sanity says whose it is
    const me = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-06-07/users/me`, { headers });
    if (!me.ok) return false;
    const user = (await me.json().catch(() => null)) as { id?: string } | null;
    return Boolean(user?.id);
  }).catch(() => false);
}

const STUDIO_TOKEN_KEY = `__studio_auth_token_${SANITY_PROJECT_ID}`;
const PASSWORD_LOGIN_KEY = "ogcw-admin-password-login";

/** Log in with the admin password: the server checks it and hands back the studio's key (src/lib/admin-password.ts) */
export async function passwordLogin(password: string) {
  const result = await passwordAdminLogin({ data: password });
  if (!result.ok) throw new Error(result.message);
  localStorage.setItem(STUDIO_TOKEN_KEY, JSON.stringify({ token: result.token }));
  localStorage.setItem(PASSWORD_LOGIN_KEY, "1");
  answers.clear();
  accessChanged();
}

/** Logging in or out without a page load: everything that asked "who is this?" asks again (the site's edit buttons, the menu) */
const ACCESS_EVENT = "ogcw:access-changed";
const accessChanged = () => window.dispatchEvent(new Event(ACCESS_EVENT));

/** Logged in here with the admin password (not with GitHub) */
export function loggedInWithPassword() {
  try {
    return localStorage.getItem(PASSWORD_LOGIN_KEY) === "1" && !!localStorage.getItem(STUDIO_TOKEN_KEY);
  } catch {
    return false;
  }
}

/** Log out of the studio on this browser (the admin password or GitHub) */
export function studioLogout() {
  try {
    localStorage.removeItem(STUDIO_TOKEN_KEY);
    localStorage.removeItem(PASSWORD_LOGIN_KEY);
  } catch {
    // nothing kept, nothing to remove
  }
  answers.clear();
  accessChanged();
}

/**
 * Log in to the studio with GitHub, through Sanity itself (the same login
 * the studio's own login screen uses). Sanity sends the browser back to
 * `returnTo` with a one-time "#sid=…" in the address, which
 * finishStudioLogin swaps for the studio's login token.
 */
export function studioLogin(returnTo: string) {
  const params = new URLSearchParams({ origin: `${window.location.origin}${returnTo}`, projectId: SANITY_PROJECT_ID, type: "dual" });
  window.location.assign(`https://api.sanity.io/v1/auth/login/github?${params}`);
}

/** Back from the GitHub login: keep the studio's login token, as the studio itself would */
let finishing: Promise<void> | null = null;
export function finishStudioLogin() {
  finishing ??= (async () => {
    const match = window.location.hash.match(/sid=([^&]{20,})/);
    if (!match) return;
    const url = new URL(window.location.href);
    url.hash = window.location.hash.replace(/&?sid=[^&]+/, "").replace(/^#&?$/, "");
    history.replaceState(history.state, "", url);
    const response = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-06-07/auth/fetch?sid=${encodeURIComponent(match[1]!)}`);
    if (!response.ok) throw new Error("The GitHub login didn’t go through. Try again.");
    const { token } = (await response.json()) as { token?: string };
    if (!token) throw new Error("The GitHub login didn’t go through. Try again.");
    localStorage.setItem(STUDIO_TOKEN_KEY, JSON.stringify({ token }));
  })();
  return finishing;
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
      await finishStudioLogin().catch(() => {});
      const result = await accountAccess();
      if (current) setAccess(result === "admin" || (await sanityMember()) ? "admin" : result);
    };
    void check();
    const { data } = getSupabase().auth.onAuthStateChange(() => { void check(); });
    // The admin password (no page load), or a login or logout in another tab
    const recheck = () => { void check(); };
    const onStorage = (event: StorageEvent) => { if (event.key === STUDIO_TOKEN_KEY || event.key === PASSWORD_LOGIN_KEY) recheck(); };
    window.addEventListener(ACCESS_EVENT, recheck);
    window.addEventListener("storage", onStorage);
    return () => {
      current = false;
      data.subscription.unsubscribe();
      window.removeEventListener(ACCESS_EVENT, recheck);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return access;
}
