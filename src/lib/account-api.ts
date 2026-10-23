import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The doors from the page to the account server (src/lib/server/account.server.ts).
// Each checks the shape of what it's given before anything runs; TanStack
// Start's request check (src/start.ts) turns away calls from other websites.

const impl = () => import("./server/account.server");

const email = z.string().max(320);
const password = z.string().max(200);
const captcha = z.string().max(4096).optional();
const code = z.string().max(12);
const parse = <T extends z.ZodTypeAny>(schema: T) => (data: unknown): z.infer<T> => schema.parse(data);

export const accountStateFn = createServerFn({ method: "POST" }).handler(async () => (await impl()).state());

export const signInFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ email, password, captcha })))
  .handler(async ({ data }) => (await impl()).signIn(data));

export const verifyCodeFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ code })))
  .handler(async ({ data }) => (await impl()).verifyCode(data));

export const signOutFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ everywhere: z.boolean().optional() })))
  .handler(async ({ data }) => (await impl()).signOut(data));

export const startOAuthFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ provider: z.enum(["google", "github"]) })))
  .handler(async ({ data }) => (await impl()).startOAuth(data));

export const finishOAuthFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ code: z.string().min(10).max(500) })))
  .handler(async ({ data }) => (await impl()).finishOAuth(data));

export const confirmLinkFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ tokenHash: z.string().min(10).max(500), type: z.enum(["signup", "invite", "magiclink", "recovery", "email_change", "email"]) })))
  .handler(async ({ data }) => (await impl()).confirmLink(data));

export const adoptTokensFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ accessToken: z.string().min(20).max(8000), refreshToken: z.string().min(4).max(500), type: z.string().max(40).optional() })))
  .handler(async ({ data }) => (await impl()).adoptTokens(data));

export const signUpFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ name: z.string().max(200), email, password, captcha })))
  .handler(async ({ data }) => (await impl()).signUp(data));

export const signUpPhoneFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ name: z.string().max(200), email, phone: z.string().max(20), password, captcha })))
  .handler(async ({ data }) => (await impl()).signUpPhone(data));

export const resendPhoneFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ phone: z.string().max(20) })))
  .handler(async ({ data }) => (await impl()).resendPhone(data));

export const verifyPhoneFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ phone: z.string().max(20), code, email })))
  .handler(async ({ data }) => (await impl()).verifyPhone(data));

export const sendResetFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ email, captcha })))
  .handler(async ({ data }) => (await impl()).sendReset(data));

export const setPasswordFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ password })))
  .handler(async ({ data }) => (await impl()).setPassword(data));

export const changePasswordFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ current: password, password, captcha })))
  .handler(async ({ data }) => (await impl()).changePassword(data));

export const twoStepStartFn = createServerFn({ method: "POST" }).handler(async () => (await impl()).twoStepStart());

export const twoStepConfirmFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ factorId: z.string().max(100), code })))
  .handler(async ({ data }) => (await impl()).twoStepConfirm(data));

export const twoStepStopFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ code })))
  .handler(async ({ data }) => (await impl()).twoStepStop(data));
