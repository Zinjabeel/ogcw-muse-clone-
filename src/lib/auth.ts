import { useEffect, useSyncExternalStore } from "react";
import {
  accountStateFn, adoptTokensFn, changePasswordFn, confirmLinkFn, finishOAuthFn, resendPhoneFn, sendResetFn, setPasswordFn, signInFn, signOutFn,
  signUpFn, signUpPhoneFn, startOAuthFn, twoStepConfirmFn, twoStepStartFn, twoStepStopFn, verifyCodeFn, verifyPhoneFn,
} from "./account-api";
import { SIGNED_OUT, type AccountState, type AccountUser } from "./account-types";
import { SANITY_PROJECT_ID } from "@/sanity/env";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";

// OGCW accounts, on the page: create an account (/signup), log in (/login,
// and For Work at /work), Google, a forgotten password, two-step login and
// the account page (/account). Since 22 Oct 2026 the login itself is kept by
// the server in a cookie this page can't read (src/lib/server/session.server.ts):
// every step here asks the server (src/lib/account-api.ts), and the page only
// ever learns who is logged in, never the keys to the account.

export type User = AccountUser;
export type Account = AccountState & { ready: boolean };
export type Provider = "google" | "github";

/** A step that didn't work: the message is for the reader; `needsCode` asks for the two-step code first */
export class AccountError extends Error {
  needsCode: boolean;
  constructor(message: string, needsCode = false) {
    super(message);
    this.needsCode = needsCode;
  }
}
type Answer = { ok: true } | { ok: false; message: string; needsCode?: boolean };
function unwrap<T extends Answer>(answer: T): Extract<T, { ok: true }> {
  if (!answer.ok) throw new AccountError(answer.message, answer.needsCode ?? false);
  return answer as Extract<T, { ok: true }>;
}

// ---------------------------------------------------------------- Who's logged in (one answer for the whole page)

const OFFLINE: Account = { ...SIGNED_OUT, ready: false };
let account: Account = OFFLINE;
let started = false;
let checkedAt = 0;
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();
/** Fired after every login, logout or change, here and in this browser's other tabs */
export const ACCOUNT_EVENT = "ogcw:account-changed";

function publish(next: Account) {
  account = next;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new Event(ACCOUNT_EVENT));
}

/** Ask the server again who is logged in (after a login, a logout or a change) */
export async function refreshAccount(tellOtherTabs = true) {
  checkedAt = Date.now();
  try {
    publish({ ...(await accountStateFn()), ready: true });
  } catch {
    publish({ ...account, ready: true });
  }
  if (tellOtherTabs) channel?.postMessage("changed");
}

// Logins from before 22 Oct 2026 were kept in this browser's storage: they
// move to the server's cookie once (so nobody is logged out), then go
const OLD_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
type OldLogin = { access_token?: string; refresh_token?: string } | null;
async function moveOldLogin() {
  let old: OldLogin;
  try {
    old = JSON.parse(localStorage.getItem(OLD_KEY) ?? "null") as OldLogin;
    localStorage.removeItem(OLD_KEY);
    localStorage.removeItem("ogcw-accounts");
    localStorage.removeItem("ogcw-session");
    // The studio key the old 6-digit admin password handed out (a shared key, not a person's login) goes too
    if (localStorage.getItem("ogcw-admin-password-login") === "1") localStorage.removeItem(`__studio_auth_token_${SANITY_PROJECT_ID}`);
    localStorage.removeItem("ogcw-admin-password-login");
  } catch {
    return;
  }
  if (old?.access_token && old.refresh_token) await adoptTokensFn({ data: { accessToken: old.access_token, refreshToken: old.refresh_token } }).catch(() => {});
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    channel = new BroadcastChannel("ogcw-account");
    channel.onmessage = () => void refreshAccount(false);
  } catch {
    // older browsers: other tabs catch up on their next visit
  }
  // Back to the tab after a while: check the login is still on
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - checkedAt > 5 * 60_000) void refreshAccount(false);
  });
  void moveOldLogin().finally(() => void refreshAccount(false));
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The account on this page: who, two-step login, admin access */
export function useAccount(): Account {
  useEffect(start, []);
  return useSyncExternalStore(subscribe, () => account, () => OFFLINE);
}

/** The account as last heard from the server, outside React */
export const currentAccount = (): Account => account;

/** The logged-in reader (null when logged out, while the two-step code is still due, and on the server) */
export function useUser(): { user: User | null; ready: boolean } {
  const { user, needsCode, ready } = useAccount();
  return { user: needsCode ? null : user, ready };
}

// ---------------------------------------------------------------- Logging in and out

/** Email and password. `needsCode`: two-step login is on, ask for the code next. */
export async function signIn(input: { email: string; password: string; captcha?: string }) {
  const answer = unwrap(await signInFn({ data: input }));
  await refreshAccount();
  return { needsCode: answer.needsCode, leaked: answer.leaked };
}

/** The 6-digit code from the authenticator app */
export async function verifyLoginCode(code: string) {
  unwrap(await verifyCodeFn({ data: { code } }));
  await refreshAccount();
}

export async function signOut(options: { everywhere?: boolean } = {}) {
  await signOutFn({ data: { everywhere: options.everywhere ?? false } }).catch(() => {});
  await refreshAccount();
}

const NEXT_KEY = "ogcw-auth-next";
/** Log in with Google (or GitHub): off to their page, then back to /auth/confirm and on to `returnTo` */
export async function signInWith(provider: Provider, returnTo: string) {
  try { sessionStorage.setItem(NEXT_KEY, returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/"); } catch { /* back to the front page instead */ }
  const answer = unwrap(await startOAuthFn({ data: { provider } }));
  window.location.assign(answer.url);
}
/** Where to go after a login that left the site (Google, an email link) */
export function takeNext(): string {
  try {
    const next = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  } catch {
    return "/";
  }
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

// ---------------------------------------------------------------- Links from emails, and coming back from Google

export async function confirmEmailLink(tokenHash: string, type: "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email") {
  const answer = unwrap(await confirmLinkFn({ data: { tokenHash, type } }));
  await refreshAccount();
  return answer;
}
export async function adoptLinkTokens(accessToken: string, refreshToken: string, type?: string) {
  const answer = unwrap(await adoptTokensFn({ data: { accessToken, refreshToken, ...(type ? { type } : {}) } }));
  await refreshAccount();
  return answer;
}
export async function finishOAuth(code: string) {
  const answer = unwrap(await finishOAuthFn({ data: { code } }));
  await refreshAccount();
  return answer;
}

// ---------------------------------------------------------------- New accounts

/** Create an account. Supabase emails a link to confirm the address; until it's opened, `confirm` is true. */
export async function signUp(input: { name: string; email: string; password: string; captcha?: string }) {
  const answer = unwrap(await signUpFn({ data: input }));
  if (!answer.confirm) await refreshAccount();
  return { confirm: answer.confirm };
}

// Sign-up with a phone code, once text messages are switched on in Supabase
// (Authentication → Providers → Phone, with an SMS service). Supabase's codes
// are 6 digits unless "SMS OTP length" is changed there.

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

export async function signUpWithPhone(input: { name: string; email: string; phone: string; password: string; captcha?: string }) {
  const phone = normalisePhone(input.phone);
  return unwrap(await signUpPhoneFn({ data: { ...input, phone } }));
}
export async function resendPhoneCode(phone: string) {
  unwrap(await resendPhoneFn({ data: { phone } }));
}
export async function verifyPhoneCode(input: { phone: string; code: string; email: string }) {
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(input.code)) throw new AccountError(`Type all ${CODE_LENGTH} digits of the code.`);
  const answer = unwrap(await verifyPhoneFn({ data: input }));
  await refreshAccount();
  return { ...(answer.emailProblem ? { emailProblem: answer.emailProblem } : {}) };
}

// ---------------------------------------------------------------- Passwords

/** Email a link to choose a new password (the page always says it's sent) */
export async function sendPasswordReset(email: string, captcha?: string) {
  unwrap(await sendResetFn({ data: { email, ...(captcha ? { captcha } : {}) } }));
}
/** A new password, after opening the reset link */
export async function setNewPassword(password: string) {
  unwrap(await setPasswordFn({ data: { password } }));
  await refreshAccount();
}
/** Change the password while logged in (the current one first) */
export async function changePassword(current: string, password: string, captcha?: string) {
  unwrap(await changePasswordFn({ data: { current, password, ...(captcha ? { captcha } : {}) } }));
  await refreshAccount();
}

// ---------------------------------------------------------------- Two-step login

export async function startTwoStep() {
  return unwrap(await twoStepStartFn());
}
export async function confirmTwoStep(factorId: string, code: string) {
  unwrap(await twoStepConfirmFn({ data: { factorId, code } }));
  await refreshAccount();
}
export async function stopTwoStep(code: string) {
  unwrap(await twoStepStopFn({ data: { code } }));
  await refreshAccount();
}
