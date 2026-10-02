import { useEffect, useState } from "react";
import { isAuthApiError, type AuthError, type User as SupabaseUser } from "@supabase/supabase-js";
import { SANITY_PROJECT_ID } from "@/sanity/env";
import { getSupabase } from "./supabase";

// Reader accounts (sign up, sign in, sign out), used by /login and the
// account button in the header. Accounts live in Supabase (src/lib/supabase.ts),
// so they work on any device: Supabase keeps the name and email and only a
// hashed form of the password, and keeps the reader signed in on this device.
//
// Admins don't use these accounts: they sign in to the studio at /admin with
// GitHub (Sanity's own login; only the Sanity project's members get in).

export type User = { id: string; name: string; email: string };

const toUser = (user: SupabaseUser): User => {
  const email = user.email ?? "";
  const name = typeof user.user_metadata["name"] === "string" ? user.user_metadata["name"].trim() : "";
  return { id: user.id, email, name: name || email.split("@")[0] || "Reader" };
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
    case "email_exists": return new Error("There’s already an account with this email. Sign in instead.");
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

/** Whether this browser is signed in to the OGCW studio (/admin) as an admin */
export function hasStudioSession() {
  try {
    return Boolean(localStorage.getItem(`__studio_auth_token_${SANITY_PROJECT_ID}`));
  } catch {
    return false;
  }
}

/** The signed-in reader (null when signed out, and on the server) and whether the studio is signed in */
export function useUser() {
  const [state, setState] = useState<{ user: User | null; admin: boolean; ready: boolean }>({ user: null, admin: false, ready: false });
  useEffect(() => {
    // Accounts used to live in the browser (until 2 October 2026): clear them out
    try {
      localStorage.removeItem("ogcw-accounts");
      localStorage.removeItem("ogcw-session");
    } catch {
      // storage blocked: nothing stored either
    }
    const auth = getSupabase().auth;
    const show = (user: SupabaseUser | null | undefined) => setState({ user: user ? toUser(user) : null, admin: hasStudioSession(), ready: true });
    // Fires straight away with the saved session, then on every sign in and out (here and in other tabs)
    const { data } = auth.onAuthStateChange((_event, session) => show(session?.user));
    const onStorage = () => setState((current) => ({ ...current, admin: hasStudioSession() }));
    window.addEventListener("storage", onStorage); // the studio, signed in or out in another tab
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return state;
}
