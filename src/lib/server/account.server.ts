import { isAuthApiError, type AuthError, type EmailOtpType } from "@supabase/supabase-js";
import { blocked, count, forgive, LIMITS, TOO_MANY } from "./guard.server";
import { leakCount, passwordProblem } from "./passwords.server";
import {
  accountState, clearSession, clientIp, endRecovery, inRecovery, keepSession, markRecovery, openSession, requestOrigin, SIGNED_OUT,
  supabaseClient, verifiedFactors, writeSession, type AccountState,
} from "./session.server";

// Everything an OGCW account can do, run on the server (22 Oct 2026), so the
// browser never holds the login (src/lib/server/session.server.ts), every
// try is counted (src/lib/server/guard.server.ts) and every new password is
// checked (src/lib/server/passwords.server.ts). The page calls these through
// src/lib/account-api.ts. Answers never say whether an email address has an
// account, so nobody can use the forms to find out who's signed up.

export type Fail = { ok: false; message: string; needsCode?: boolean };
type Done<T extends object = object> = { ok: true } & T;
const fail = (message: string, extra: { needsCode?: boolean } = {}): Fail => ({ ok: false, message, ...extra });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normaliseEmail = (email: string) => email.trim().toLowerCase();
const LINK_RAN_OUT = "This link has expired or was already used. Ask for a new one.";
const LOGIN_RAN_OUT = "Your login has run out. Log in again.";

// Supabase's errors, in plain words
function readable(error: AuthError | null): string {
  const code = error && isAuthApiError(error) ? error.code : undefined;
  switch (code) {
    case "invalid_credentials": return "That email and password don’t match.";
    case "email_not_confirmed": return "Confirm your email first: open the link we sent when you signed up. It may be in your spam folder.";
    case "phone_exists": return "There’s already an account with this phone number. Log in instead.";
    case "otp_expired": return "That code isn’t right, or it has expired. Try again, or send a new code.";
    case "sms_send_failed": return "We couldn’t send a text to that number. Check it and try again.";
    case "phone_provider_disabled": return "Text-message codes aren’t switched on yet.";
    case "validation_failed": return "Something in the form doesn’t look right. Check it and try again.";
    case "weak_password": return "Choose a stronger password: longer, and harder to guess.";
    case "same_password": return "That’s your current password. Choose a new one.";
    case "email_address_invalid": return "That email address doesn’t look right.";
    case "signup_disabled": return "New accounts are paused for now. Try again later.";
    case "captcha_failed": return "The “are you human” check didn’t go through. Refresh the page and try again.";
    case "provider_disabled": return "That login isn’t switched on yet.";
    case "user_banned": return "This account is suspended. Email us if you think that’s a mistake.";
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
    case "over_request_rate_limit": return "Too many tries just now. Wait a few minutes and try again.";
  }
  if (error && !isAuthApiError(error)) return "We couldn’t reach the account service. Check your connection and try again.";
  return "Something went wrong. Try again.";
}

const withCaptcha = (captcha?: string) => (captcha ? { captchaToken: captcha } : {});

// ---------------------------------------------------------------- Who's here

export async function state(): Promise<AccountState> {
  const open = await openSession().catch(() => null);
  return open ? accountState(open.session) : SIGNED_OUT;
}

// ---------------------------------------------------------------- Logging in

export async function signIn(input: { email: string; password: string; captcha?: string | undefined }): Promise<Done<{ needsCode: boolean; leaked: boolean }> | Fail> {
  const email = normaliseEmail(input.email);
  if (!EMAIL.test(email)) return fail("That email address doesn’t look right.");
  if (!input.password) return fail("Add your password.");
  // Too many wrong tries on this account, or from this visitor: stop here
  if (await blocked(LIMITS.loginAccount, email)) return fail(TOO_MANY);
  if (!(await count(LIMITS.loginIp, clientIp()))) return fail(TOO_MANY);

  const client = supabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password: input.password, options: withCaptcha(input.captcha) });
  if (error || !data.session) {
    if (!error || (isAuthApiError(error) && error.code === "invalid_credentials")) await count(LIMITS.loginAccount, email);
    return fail(readable(error));
  }
  writeSession(data.session);
  await forgive(LIMITS.loginAccount, email);
  const account = await accountState(data.session);
  // A password that has leaked somewhere still logs in, but they're told to change it
  const leaked = (await leakCount(input.password)) > 0;
  return { ok: true, needsCode: account.needsCode, leaked };
}

/** The 6-digit code from the authenticator app, after the password */
export async function verifyCode(input: { code: string }): Promise<Done | Fail> {
  if (!/^\d{6}$/.test(input.code)) return fail("Type all 6 digits of the code.");
  const open = await openSession();
  if (!open) return fail(LOGIN_RAN_OUT);
  const user = open.session.user;
  if (await blocked(LIMITS.code, user.id)) return fail(TOO_MANY);
  const factors = verifiedFactors(user);
  if (!factors.length) return { ok: true };
  for (const factor of factors) {
    const { error } = await open.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: input.code });
    if (!error) {
      await keepSession(open.client);
      await forgive(LIMITS.code, user.id);
      return { ok: true };
    }
  }
  await count(LIMITS.code, user.id);
  return fail("That code isn’t right. Check your authenticator app and try again.");
}

export async function signOut(input: { everywhere?: boolean | undefined }): Promise<Done> {
  const open = await openSession().catch(() => null);
  if (open) await open.client.auth.signOut({ scope: input.everywhere ? "global" : "local" }).catch(() => {});
  clearSession();
  return { ok: true };
}

// ---------------------------------------------------------------- Google (and GitHub, if switched on)

export async function startOAuth(input: { provider: "google" | "github" }): Promise<Done<{ url: string }> | Fail> {
  const client = supabaseClient({ pkce: true });
  const { data, error } = await client.auth.signInWithOAuth({
    provider: input.provider,
    options: { redirectTo: `${requestOrigin()}/auth/confirm`, skipBrowserRedirect: true, ...(input.provider === "google" ? { queryParams: { prompt: "select_account" } } : {}) },
  });
  if (error || !data.url) return fail(readable(error));
  return { ok: true, url: data.url };
}

export async function finishOAuth(input: { code: string }): Promise<Done<{ needsCode: boolean }> | Fail> {
  const client = supabaseClient({ pkce: true });
  const { data, error } = await client.auth.exchangeCodeForSession(input.code);
  if (error || !data.session) return fail("That login didn’t go through. Start again from the same browser.");
  writeSession(data.session);
  return { ok: true, needsCode: (await accountState(data.session)).needsCode };
}

// ---------------------------------------------------------------- Links from emails

const LINK_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
type LinkType = (typeof LINK_TYPES)[number];
export const isLinkType = (type: unknown): type is LinkType => LINK_TYPES.includes(type as LinkType);

/** Our own emails' links: a one-time key, checked here */
export async function confirmLink(input: { tokenHash: string; type: LinkType }): Promise<Done<{ type: LinkType; needsCode: boolean; partial?: boolean }> | Fail> {
  const client = supabaseClient();
  const { data, error } = await client.auth.verifyOtp({ token_hash: input.tokenHash, type: input.type as EmailOtpType });
  if (error) return fail(LINK_RAN_OUT);
  // An email change confirmed from one address waits for the other one
  if (!data.session) return { ok: true, type: input.type, needsCode: false, partial: true };
  writeSession(data.session);
  if (input.type === "recovery") markRecovery();
  return { ok: true, type: input.type, needsCode: (await accountState(data.session)).needsCode };
}

/** Supabase's standard emails' links: the login comes back in the address, handed over here */
export async function adoptTokens(input: { accessToken: string; refreshToken: string; type?: string | undefined }): Promise<Done<{ needsCode: boolean }> | Fail> {
  const client = supabaseClient();
  const { data, error } = await client.auth.setSession({ access_token: input.accessToken, refresh_token: input.refreshToken });
  if (error || !data.session) return fail(LINK_RAN_OUT);
  writeSession(data.session);
  // Only a login that Supabase itself made from a reset email counts as one
  const amr = (JSON.parse(atob((data.session.access_token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/"))) as { amr?: { method?: string; timestamp?: number }[] }).amr ?? [];
  const fresh = amr.some((entry) => (entry.method === "recovery" || entry.method === "otp") && (entry.timestamp ?? 0) * 1000 > Date.now() - 15 * 60_000);
  if (input.type === "recovery" && fresh) markRecovery();
  return { ok: true, needsCode: (await accountState(data.session)).needsCode };
}

// ---------------------------------------------------------------- New accounts

export async function signUp(input: { name: string; email: string; password: string; captcha?: string | undefined }): Promise<Done<{ confirm: boolean }> | Fail> {
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) return fail("Add your name.");
  if (name.length > 60) return fail("Keep your name under 60 characters.");
  if (!EMAIL.test(email)) return fail("That email address doesn’t look right.");
  if (!(await count(LIMITS.signupIp, clientIp()))) return fail(TOO_MANY);
  const problem = await passwordProblem(input.password, { email, name });
  if (problem) return fail(problem);

  const client = supabaseClient();
  const { data, error } = await client.auth.signUp({ email, password: input.password, options: { data: { name }, emailRedirectTo: `${requestOrigin()}/auth/confirm`, ...withCaptcha(input.captcha) } });
  if (error) {
    // Already signed up: the answer is the same as for a new address
    if (isAuthApiError(error) && (error.code === "email_exists" || error.code === "user_already_exists")) return { ok: true, confirm: true };
    return fail(readable(error));
  }
  if (data.session) {
    writeSession(data.session);
    return { ok: true, confirm: false };
  }
  return { ok: true, confirm: true };
}

// Sign-up with a phone code, once text messages are switched on in Supabase
export async function signUpPhone(input: { name: string; email: string; phone: string; password: string; captcha?: string | undefined }): Promise<Done<{ phone: string; email: string }> | Fail> {
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) return fail("Add your name.");
  if (name.length > 60) return fail("Keep your name under 60 characters.");
  if (!EMAIL.test(email)) return fail("That email address doesn’t look right.");
  if (!/^\+\d{8,15}$/.test(input.phone)) return fail("Add your phone number with + and your country code, e.g. +44 7700 900123.");
  if (!(await count(LIMITS.phoneIp, clientIp()))) return fail(TOO_MANY);
  const problem = await passwordProblem(input.password, { email, name });
  if (problem) return fail(problem);
  const { error } = await supabaseClient().auth.signUp({ phone: input.phone, password: input.password, options: { data: { name }, ...withCaptcha(input.captcha) } });
  if (error) return fail(readable(error));
  return { ok: true, phone: input.phone, email };
}

export async function resendPhone(input: { phone: string }): Promise<Done | Fail> {
  if (!(await count(LIMITS.phoneIp, clientIp()))) return fail(TOO_MANY);
  const { error } = await supabaseClient().auth.resend({ type: "sms", phone: input.phone });
  return error ? fail(readable(error)) : { ok: true };
}

export async function verifyPhone(input: { phone: string; code: string; email: string }): Promise<Done<{ emailProblem?: string }> | Fail> {
  if (!/^\d{6}$/.test(input.code)) return fail("Type all 6 digits of the code.");
  if (await blocked(LIMITS.code, input.phone)) return fail(TOO_MANY);
  const client = supabaseClient();
  const { data, error } = await client.auth.verifyOtp({ phone: input.phone, token: input.code, type: "sms" });
  if (error || !data.session) {
    await count(LIMITS.code, input.phone);
    return fail(readable(error));
  }
  writeSession(data.session);
  const { error: emailError } = await client.auth.updateUser({ email: normaliseEmail(input.email) }, { emailRedirectTo: `${requestOrigin()}/auth/confirm` });
  await keepSession(client);
  return { ok: true, ...(emailError ? { emailProblem: readable(emailError) } : {}) };
}

// ---------------------------------------------------------------- Passwords

/** Email a link to choose a new password. Always "sent", whether or not there's an account. */
export async function sendReset(input: { email: string; captcha?: string | undefined }): Promise<Done | Fail> {
  const email = normaliseEmail(input.email);
  if (!EMAIL.test(email)) return fail("That email address doesn’t look right.");
  if (!(await count(LIMITS.resetIp, clientIp()))) return fail(TOO_MANY);
  // Three links an hour per address at most; beyond that, quietly no more
  if (!(await count(LIMITS.resetAccount, email))) return { ok: true };
  const { error } = await supabaseClient().auth.resetPasswordForEmail(email, { redirectTo: `${requestOrigin()}/auth/confirm`, ...withCaptcha(input.captcha) });
  if (error && isAuthApiError(error) && ["captcha_failed", "over_email_send_rate_limit", "over_request_rate_limit"].includes(error.code ?? "")) return fail(readable(error));
  return { ok: true };
}

async function savePassword(password: string): Promise<Done | Fail> {
  const open = await openSession();
  if (!open) return fail(LOGIN_RAN_OUT);
  const user = open.session.user;
  const problem = await passwordProblem(password, { email: user.email ?? "", name: String(user.user_metadata?.["name"] ?? "") });
  if (problem) return fail(problem);
  const { error } = await open.client.auth.updateUser({ password });
  if (error) {
    if (isAuthApiError(error) && error.code === "insufficient_aal") return fail("Type the code from your authenticator app first.", { needsCode: true });
    return fail(readable(error));
  }
  await keepSession(open.client);
  // Everywhere else this account was logged in is logged out
  await open.client.auth.signOut({ scope: "others" }).catch(() => {});
  return { ok: true };
}

/** A new password after opening a reset link (or a first password for a Google account) */
export async function setPassword(input: { password: string }): Promise<Done | Fail> {
  const open = await openSession();
  if (!open) return fail("That reset link has run out. Ask for a new one.");
  const account = await accountState(open.session);
  if (!inRecovery() && account.hasPassword) return fail("Type your current password to change it.");
  if (account.needsCode) return fail("Type the code from your authenticator app first.", { needsCode: true });
  const result = await savePassword(input.password);
  if (result.ok) endRecovery();
  return result;
}

/** Change the password while logged in: the current one is checked first */
export async function changePassword(input: { current: string; password: string; captcha?: string | undefined }): Promise<Done | Fail> {
  const open = await openSession();
  if (!open) return fail(LOGIN_RAN_OUT);
  const user = open.session.user;
  const account = await accountState(open.session);
  if (account.needsCode) return fail("Type the code from your authenticator app first.", { needsCode: true });
  if (account.hasPassword) {
    if (await blocked(LIMITS.passwordCheck, user.id)) return fail(TOO_MANY);
    const check = supabaseClient();
    // (a login, so it needs the "are you human" pass too once that's switched on)
    const { data, error } = await check.auth.signInWithPassword({ email: user.email ?? "", password: input.current, options: withCaptcha(input.captcha) });
    if (error || !data.session) {
      await count(LIMITS.passwordCheck, user.id);
      return fail("Your current password isn’t right.");
    }
    // That check made a login of its own: end it straight away
    await check.auth.signOut({ scope: "local" }).catch(() => {});
  }
  return savePassword(input.password);
}

// ---------------------------------------------------------------- Two-step login (an authenticator app)

export async function twoStepStart(): Promise<Done<{ factorId: string; qr: string; secret: string }> | Fail> {
  const open = await openSession();
  if (!open) return fail(LOGIN_RAN_OUT);
  if ((await accountState(open.session)).needsCode) return fail("Type the code from your authenticator app first.", { needsCode: true });
  // A set-up started before and never finished is cleared first
  const { data: factors } = await open.client.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) if (factor.status !== "verified") await open.client.auth.mfa.unenroll({ factorId: factor.id }).catch(() => {});
  const { data, error } = await open.client.auth.mfa.enroll({ factorType: "totp", issuer: "OGCW", friendlyName: `Authenticator app (${new Date().toISOString().slice(0, 10)})` });
  if (error || !data) return fail("Two-step login couldn’t start. Try again.");
  const qr = data.totp.qr_code.startsWith("data:") ? data.totp.qr_code : `data:image/svg+xml;utf-8,${encodeURIComponent(data.totp.qr_code)}`;
  return { ok: true, factorId: data.id, qr, secret: data.totp.secret };
}

export async function twoStepConfirm(input: { factorId: string; code: string }): Promise<Done | Fail> {
  if (!/^\d{6}$/.test(input.code)) return fail("Type all 6 digits of the code.");
  const open = await openSession();
  if (!open) return fail(LOGIN_RAN_OUT);
  const user = open.session.user;
  if (await blocked(LIMITS.code, user.id)) return fail(TOO_MANY);
  const { error } = await open.client.auth.mfa.challengeAndVerify({ factorId: input.factorId, code: input.code });
  if (error) {
    await count(LIMITS.code, user.id);
    return fail("That code isn’t right. Check the time on your phone is set automatically, then try the newest code.");
  }
  await keepSession(open.client);
  return { ok: true };
}

export async function twoStepStop(input: { code: string }): Promise<Done | Fail> {
  if (!/^\d{6}$/.test(input.code)) return fail("Type all 6 digits of the code.");
  const open = await openSession();
  if (!open) return fail(LOGIN_RAN_OUT);
  const user = open.session.user;
  if (await blocked(LIMITS.code, user.id)) return fail(TOO_MANY);
  const factors = verifiedFactors(user);
  // The code is asked for again, so a borrowed, logged-in phone can't switch it off
  const proven = await (async () => {
    for (const factor of factors) {
      const { error } = await open.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: input.code });
      if (!error) return true;
    }
    return false;
  })();
  if (!proven) {
    await count(LIMITS.code, user.id);
    return fail("That code isn’t right. Check your authenticator app and try again.");
  }
  for (const factor of factors) await open.client.auth.mfa.unenroll({ factorId: factor.id }).catch(() => {});
  await open.client.auth.refreshSession().catch(() => {});
  await keepSession(open.client);
  return { ok: true };
}
