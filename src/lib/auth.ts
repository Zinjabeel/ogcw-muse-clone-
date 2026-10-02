import { useEffect, useState } from "react";
import { isAuthApiError, type AuthError, type User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";

// OGCW accounts: create an account, log in and out (/signup, /login, and
// For Work at /work with Google or GitHub too), reset a password. Accounts
// live in Supabase (src/lib/supabase.ts), so they work on any device:
// Supabase keeps the name and email and only a hashed form of the password.
//
// Every account is a normal reader account. Only the OGCW GitHub account
// gets into the admin dashboard, which the server decides (src/lib/work.ts).

export type User = { id: string; name: string; email: string };

const toUser = (user: SupabaseUser): User => {
  const email = user.email ?? "";
  const meta = user.user_metadata;
  // Our sign-up keeps "name"; Google and GitHub send "full_name" or "user_name"
  const name = [meta["name"], meta["full_name"], meta["user_name"]].find((value): value is string => typeof value === "string" && value.trim() !== "");
  return { id: user.id, email, name: name?.trim() || email.split("@")[0] || "Reader" };
};

const normaliseEmail = (email: string) => email.trim().toLowerCase();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Supabase's errors, in plain words
function readable(error: AuthError): Error {
  const code = isAuthApiError(error) ? error.code : undefined;
  switch (code) {
    case "invalid_credentials": return new Error("That email and password don’t match.");
    case "email_not_confirmed": return new Error("Confirm your email first: open the link we sent when you signed up.");
    case "user_already_exists":
    case "email_exists": return new Error("There’s already an account with this email. Log in instead.");
    case "weak_password": return new Error("Choose a stronger password: longer, and harder to guess.");
    case "email_address_invalid": return new Error("That email address doesn’t look right.");
    case "signup_disabled": return new Error("New accounts are paused for now. Try again later.");
    case "over_email_send_rate_limit":
    case "over_request_rate_limit": return new Error("Too many tries just now. Wait a few minutes and try again.");
  }
  if (!isAuthApiError(error)) return new Error("We couldn’t reach the account service. Check your connection and try again.");
  return new Error("Something went wrong. Try again.");
}

/**
 * Create an account. Supabase emails a link to confirm the address; until
 * it's opened, `confirm` is true and the reader isn't signed in yet.
 */
export async function signUp(input: { name: string; email: string; password: string }): Promise<{ user: User | null; confirm: boolean }> {
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) throw new Error("Add your name.");
  if (name.length > 60) throw new Error("Keep your name under 60 characters.");
  if (!EMAIL.test(email)) throw new Error("That email address doesn’t look right.");
  if (input.password.length < 8) throw new Error("Use at least 8 characters for your password.");
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password: input.password,
    options: { data: { name }, emailRedirectTo: `${window.location.origin}/login` },
  });
  if (error) throw readable(error);
  return { user: data.session && data.user ? toUser(data.user) : null, confirm: !data.session };
}

/** Sign in with email and password. Throws a readable message if it doesn't work. */
export async function signIn(input: { email: string; password: string }): Promise<User> {
  const email = normaliseEmail(input.email);
  if (!EMAIL.test(email)) throw new Error("That email address doesn’t look right.");
  if (!input.password) throw new Error("Add your password.");
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password: input.password });
  if (error) throw readable(error);
  return toUser(data.user);
}

export async function signOut() {
  await getSupabase().auth.signOut({ scope: "local" });
}

export type Provider = "google" | "github";

/** Log in with Google or GitHub: off to their page, then back to `returnTo` on this site */
export async function signInWith(provider: Provider, returnTo: string) {
  const { error } = await getSupabase().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${returnTo}` } });
  if (error) throw readable(error);
}

/** Which of Google and GitHub are switched on in Supabase (Authentication → Providers) */
export async function enabledProviders(): Promise<Record<Provider, boolean>> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } });
    const settings = (await response.json()) as { external?: Partial<Record<Provider, boolean>> };
    return { google: Boolean(settings.external?.google), github: Boolean(settings.external?.github) };
  } catch {
    return { google: false, github: false };
  }
}

/** Email a link to choose a new password; it opens /reset-password */
export async function sendPasswordReset(email: string) {
  const address = normaliseEmail(email);
  if (!EMAIL.test(address)) throw new Error("That email address doesn’t look right.");
  const { error } = await getSupabase().auth.resetPasswordForEmail(address, { redirectTo: `${window.location.origin}/reset-password` });
  if (error) throw readable(error);
}

/** Set a new password, once the link from the reset email has logged the reader in */
export async function setNewPassword(password: string) {
  if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) throw readable(error);
}

/** The current session's access token (for asking the server what this account may do) */
export async function accessToken() {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

/** The logged-in reader (null when logged out, and on the server) */
export function useUser() {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({ user: null, ready: false });
  useEffect(() => {
    // Accounts used to live in the browser (until 2 October 2026): clear them out
    try {
      localStorage.removeItem("ogcw-accounts");
      localStorage.removeItem("ogcw-session");
    } catch {
      // storage blocked: nothing stored either
    }
    // Fires straight away with the saved session, then on every login and logout (here and in other tabs)
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => setState({ user: session?.user ? toUser(session.user) : null, ready: true }));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}
