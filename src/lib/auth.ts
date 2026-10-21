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
    case "email_exists": return new Error("There’s already an account with this email. Log in instead.");
    case "user_already_exists": return new Error("There’s already an account with these details. Log in instead.");
    case "phone_exists": return new Error("There’s already an account with this phone number. Log in instead.");
    case "otp_expired": return new Error("That code isn’t right, or it has expired. Try again, or send a new code.");
    case "sms_send_failed": return new Error("We couldn’t send a text to that number. Check it and try again.");
    case "phone_provider_disabled": return new Error("Text-message codes aren’t switched on yet.");
    case "over_sms_send_rate_limit": return new Error("Too many codes sent just now. Wait a minute and try again.");
    case "validation_failed": return new Error("That phone number doesn’t look right. Start with + and your country code.");
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

// ---------------------------------------------------------------- Sign-up with a phone code
// When text-message codes are switched on in Supabase (Authentication →
// Providers → Phone, with an SMS service such as Twilio), signing up asks
// for a phone number too: the account is made with the phone and password,
// Supabase texts a code, and once the code is right the account is logged in
// and its email is added (Supabase emails a link to confirm it, after which
// email and password log in as usual). Supabase's codes are 6 digits unless
// "SMS OTP length" is changed there; the boxes on the page follow CODE_LENGTH.

/** Digits in Supabase's text-message code (its "SMS OTP length" setting, 6 by default) */
export const CODE_LENGTH = 6;

/** "+44 7700 900123" → "+447700900123"; throws if it isn't a full international number */
export function normalisePhone(raw: string) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  const international = trimmed.startsWith("+") || trimmed.startsWith("00");
  const number = trimmed.startsWith("00") ? digits.slice(2) : digits;
  if (!international || number.length < 8 || number.length > 15) throw new Error("Add your phone number with + and your country code, e.g. +44 7700 900123.");
  return `+${number}`;
}

/** Whether Supabase can send text-message codes (Phone switched on) */
export async function phoneCodesEnabled() {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } });
    const settings = (await response.json()) as { external?: { phone?: boolean } };
    return Boolean(settings.external?.phone);
  } catch {
    return false;
  }
}

/** Make the account with the phone number and password; Supabase texts the code */
export async function signUpWithPhone(input: { name: string; email: string; phone: string; password: string }) {
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) throw new Error("Add your name.");
  if (name.length > 60) throw new Error("Keep your name under 60 characters.");
  if (!EMAIL.test(email)) throw new Error("That email address doesn’t look right.");
  if (input.password.length < 8) throw new Error("Use at least 8 characters for your password.");
  const phone = normalisePhone(input.phone);
  const { error } = await getSupabase().auth.signUp({ phone, password: input.password, options: { data: { name } } });
  if (error) throw readable(error);
  return { phone, email, name };
}

/** Text a new code to the same number */
export async function resendPhoneCode(phone: string) {
  const { error } = await getSupabase().auth.resend({ type: "sms", phone });
  if (error) throw readable(error);
}

/**
 * Check the code. Right: the account is confirmed and logged in, and its
 * email is added (Supabase emails a link to confirm it). `emailProblem` says
 * if the email couldn't be added (already used by another account, say);
 * the phone account works either way.
 */
export async function verifyPhoneCode(input: { phone: string; code: string; email: string }): Promise<{ user: User; emailProblem?: string }> {
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(input.code)) throw new Error(`Type all ${CODE_LENGTH} digits of the code.`);
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.verifyOtp({ phone: input.phone, token: input.code, type: "sms" });
  if (error) throw readable(error);
  if (!data.user) throw new Error("Something went wrong. Try again.");
  const { data: updated, error: emailError } = await supabase.auth.updateUser({ email: input.email }, { emailRedirectTo: `${window.location.origin}/login` });
  return { user: toUser(updated.user ?? data.user), ...(emailError ? { emailProblem: readable(emailError).message } : {}) };
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
