import { createClient, type Session, type SupabaseClient, type SupportedStorage, type User as SupabaseUser } from "@supabase/supabase-js";
import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import type { AccountState, AccountUser } from "../account-types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../supabase";
import { adminEmails } from "./settings.server";

// Reader logins, kept by the server (22 Oct 2026). The login lives in a
// cookie the page's scripts can't read (HttpOnly), sent only over HTTPS on
// the live site (Secure) and never on requests from other sites
// (SameSite=Lax), so a script that got onto a page couldn't steal it. Every
// account action goes through the server (src/lib/account-api.ts), which
// checks the login with Supabase each time and renews it when it runs out.

const COOKIE = "ogcw-session";
const COOKIE_SECURE = "__Host-ogcw-session";
const PKCE = "ogcw-pkce";
const PKCE_SECURE = "__Host-ogcw-pkce";
const RECOVERY = "ogcw-recovery";
const RECOVERY_SECURE = "__Host-ogcw-recovery";
// Logged in for 30 days from the last visit; each renewal starts it again
const SESSION_DAYS = 30;

type Stored = { a: string; r: string; e: number };

const encode = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (value: string) => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)));

/** The address the browser used, and whether it was HTTPS (behind the host's proxy too) */
export function requestOrigin(): string {
  const request = getRequest();
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\/[^/]+$/.test(origin)) return origin;
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? url.host;
  return `${proto}://${host}`;
}
const isHttps = () => requestOrigin().startsWith("https://");

/** The visitor's IP address, as the host reports it */
export function clientIp(): string {
  const headers = getRequest().headers;
  return (headers.get("cf-connecting-ip") ?? headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim() || "unknown";
}

function cookieNames(plain: string, secure: string) {
  return isHttps() ? { use: secure, other: plain } : { use: plain, other: secure };
}
function putCookie(plain: string, secure: string, value: string, maxAge: number) {
  const names = cookieNames(plain, secure);
  setCookie(names.use, value, { httpOnly: true, secure: isHttps(), sameSite: "lax", path: "/", maxAge });
  if (getCookie(names.other)) deleteCookie(names.other, { path: "/" });
}
function dropCookie(plain: string, secure: string) {
  for (const name of [plain, secure]) if (getCookie(name)) deleteCookie(name, { path: "/", secure: name.startsWith("__Host-") });
}
const readCookie = (plain: string, secure: string) => getCookie(secure) ?? getCookie(plain);

// ---------------------------------------------------------------- The login cookie

function readStored(): Stored | null {
  const raw = readCookie(COOKIE, COOKIE_SECURE);
  if (!raw || raw.length > 4000) return null;
  try {
    const value = JSON.parse(decode(raw)) as Partial<Stored>;
    if (typeof value.a !== "string" || typeof value.r !== "string" || typeof value.e !== "number") return null;
    return { a: value.a, r: value.r, e: value.e };
  } catch {
    return null;
  }
}

export function writeSession(session: Pick<Session, "access_token" | "refresh_token" | "expires_at">) {
  const stored: Stored = { a: session.access_token, r: session.refresh_token, e: session.expires_at ?? 0 };
  putCookie(COOKIE, COOKIE_SECURE, encode(JSON.stringify(stored)), SESSION_DAYS * 86_400);
}

export function clearSession() {
  dropCookie(COOKIE, COOKIE_SECURE);
  dropCookie(RECOVERY, RECOVERY_SECURE);
}

// ---------------------------------------------------------------- Supabase, from the server

/**
 * A Supabase client for this request. It keeps nothing between requests;
 * `storage` is only for the Google login's one-time PKCE key (see below).
 * The visitor's own IP address goes with it, for Supabase's limits.
 */
export function supabaseClient(options: { pkce?: boolean } = {}): SupabaseClient {
  const memory = new Map<string, string>();
  const storage: SupportedStorage = {
    getItem: (key) => (key.endsWith("-code-verifier") ? readCookie(PKCE, PKCE_SECURE) ?? null : memory.get(key) ?? null),
    setItem: (key, value) => {
      if (key.endsWith("-code-verifier")) putCookie(PKCE, PKCE_SECURE, value, 600);
      else memory.set(key, value);
    },
    removeItem: (key) => {
      if (key.endsWith("-code-verifier")) dropCookie(PKCE, PKCE_SECURE);
      else memory.delete(key);
    },
  };
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, storage, autoRefreshToken: false, detectSessionInUrl: false, flowType: options.pkce ? "pkce" : "implicit" },
    global: { headers: { "Sb-Forwarded-For": clientIp() } },
  });
}

/**
 * The logged-in visitor's session, checked with Supabase (a logout anywhere
 * else, or a revoked login, ends it here too) and renewed when it is close to
 * running out. null when there is no login.
 */
export async function openSession(): Promise<{ client: SupabaseClient; session: Session } | null> {
  const stored = readStored();
  if (!stored) return null;
  const client = supabaseClient();
  const { data, error } = await client.auth.setSession({ access_token: stored.a, refresh_token: stored.r });
  if (error || !data.session) {
    // Supabase unreachable: keep the cookie, but this request has no login
    if (error && error.status && error.status >= 500) return null;
    clearSession();
    return null;
  }
  if (data.session.access_token !== stored.a || data.session.refresh_token !== stored.r) writeSession(data.session);
  return { client, session: data.session };
}

/** After a step that changes the login (a code, a new password): keep the new one */
export async function keepSession(client: SupabaseClient) {
  const { data } = await client.auth.getSession();
  if (data.session) writeSession(data.session);
}

// ---------------------------------------------------------------- The one-off cookies

/** A password reset link was just opened: setting a new password needs no old one, for 15 minutes */
export const markRecovery = () => putCookie(RECOVERY, RECOVERY_SECURE, "1", 900);
export const inRecovery = () => readCookie(RECOVERY, RECOVERY_SECURE) === "1";
export const endRecovery = () => dropCookie(RECOVERY, RECOVERY_SECURE);

// ---------------------------------------------------------------- Who it is

export { SIGNED_OUT, type AccountState } from "../account-types";

function claims(token: string): Record<string, unknown> {
  try {
    return JSON.parse(decode(token.split(".")[1] ?? "")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export const accountUser = (user: SupabaseUser): AccountUser => {
  const email = user.email ?? "";
  const meta = user.user_metadata ?? {};
  const name = [meta["name"], meta["full_name"], meta["user_name"]].find((value): value is string => typeof value === "string" && value.trim() !== "");
  return { id: user.id, email, name: (name?.trim() || email.split("@")[0] || "Reader").slice(0, 60) };
};

/** The verified authenticator apps on the account */
export const verifiedFactors = (user: SupabaseUser) => (user.factors ?? []).filter((factor) => factor.status === "verified" && factor.factor_type === "totp");

export async function accountState(session: Session): Promise<AccountState> {
  const user = session.user;
  const twoStep = verifiedFactors(user).length > 0;
  const aal2 = claims(session.access_token)["aal"] === "aal2";
  const needsCode = twoStep && !aal2;
  const email = (user.email ?? "").toLowerCase();
  const listed = Boolean(email && user.email_confirmed_at && (await adminEmails()).includes(email));
  const hasPassword = (user.identities ?? []).some((identity) => identity.provider === "email") || Boolean(user.email && user.app_metadata?.["provider"] === "email");
  return { user: accountUser(user), needsCode, twoStep, hasPassword, admin: listed && aal2, adminLocked: listed && !aal2 };
}
