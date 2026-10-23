import { Check, Copy, ShieldCheck, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CodeSlots from "./code-slots";
import { GitHubMark } from "./account-button";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";
import { checkPassword, PASSWORD_MIN } from "@/lib/password-rules";
import { AccountError, confirmTwoStep, enabledProviders, signInWith, startTwoStep, verifyLoginCode, type Provider } from "@/lib/auth";

// The pieces the account pages share (22 Oct 2026): the password strength
// meter, the 6-digit code step, setting up two-step login with a QR code,
// the Google button and Cloudflare's "are you human" check.

// ---------------------------------------------------------------- Password strength

/** Under a new-password box: a bar that fills as the password gets harder to guess, and the rules, ticked as they're met */
export function PasswordStrength({ password, email, name }: { password: string; email?: string; name?: string }) {
  const report = checkPassword(password, { email: email ?? "", name: name ?? "" });
  return (
    <div className="pw-meter" data-score={password ? report.score : -1} aria-live="polite">
      <div className="pw-bar" aria-hidden="true">{[0, 1, 2, 3].map((step) => <span key={step} data-on={password && report.score > step ? "" : undefined} />)}</div>
      <p className="pw-label">{password ? <>Strength: <strong>{report.label}</strong></> : `Use at least ${PASSWORD_MIN} characters, with letters and numbers.`}</p>
      {password && (
        <ul className="pw-rules">
          {report.rules.map((rule) => (
            <li key={rule.id} data-met={rule.met ? "" : undefined}>
              {rule.met ? <Check size={13} strokeWidth={2.5} aria-hidden="true" /> : <X size={13} strokeWidth={2.5} aria-hidden="true" />}
              <span>{rule.label}<span className="sr-only">{rule.met ? ": done" : ": not yet"}</span></span>
            </li>
          ))}
          <li className="pw-rules-note">We also check it isn’t on any list of leaked passwords.</li>
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- The 6-digit code

const slotLook = {
  accentColor: "var(--ogcw-text)",
  inkColor: "var(--ogcw-text)",
  slotColor: "color-mix(in srgb, var(--ogcw-text) 7%, var(--ogcw-bg))",
  digitColor: "var(--ogcw-bg)",
  dangerColor: "#e5322d",
  slotSize: 48,
  gap: 9,
  radius: 12,
  bounce: 0.15,
  settle: 0.35,
  rise: 9,
  cascade: 40,
} as const;

/** Six boxes for a code; checks it as soon as the last digit is in */
export function CodeBoxes({ onCode, label }: { onCode: (code: string) => Promise<void>; label: string }) {
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const check = async (code: string) => {
    if (checking) return;
    setChecking(true);
    setMessage("");
    try {
      await onCode(code);
      setStatus("success");
    } catch (problem) {
      setStatus("error");
      setMessage(problem instanceof Error ? problem.message : "That code didn’t work. Try again.");
    } finally {
      setChecking(false);
    }
  };
  return (
    <div className="code-step">
      <CodeSlots length={6} status={status} onChange={() => { if (status !== "success") setStatus("idle"); }} onComplete={(code) => void check(code)} disabled={checking} autoFocus ariaLabel={label} {...slotLook} />
      {message && <p className="auth-error" role="alert">{message}</p>}
    </div>
  );
}

/** "Type the code from your authenticator app", after the password */
export function CodeStep({ onDone, onCancel }: { onDone: () => void; onCancel?: () => void }) {
  return (
    <>
      <span className="authx-icon"><Smartphone size={22} strokeWidth={1.75} aria-hidden="true" /></span>
      <h1 className="authx-title">Two-step login</h1>
      <p className="authx-lede">Open your authenticator app and type the 6-digit code for OGCW.</p>
      <CodeBoxes label="The 6-digit code from your authenticator app" onCode={async (code) => { await verifyLoginCode(code); window.setTimeout(onDone, 500); }} />
      <p className="authx-note">Lost your phone? Email <a href={mail("Two-step login")}>{BUSINESS_EMAIL}</a> from the account’s address and we’ll help you back in.</p>
      {onCancel && <button type="button" className="auth-secondary authx-wide code-step-cancel" onClick={onCancel}>Use a different account</button>}
    </>
  );
}

// ---------------------------------------------------------------- Setting up two-step login

/** Scan the QR code with an authenticator app, then type its first code */
export function TwoStepSetup({ onDone, onCancel }: { onDone: () => void; onCancel?: () => void }) {
  const [setup, setSetup] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startTwoStep().then(setSetup).catch((problem: unknown) => setError(problem instanceof Error ? problem.message : "Two-step login couldn’t start. Try again."));
  }, []);
  const key = setup?.secret.replace(/(.{4})/g, "$1 ").trim() ?? "";
  return (
    <div className="twostep">
      <ol className="twostep-steps">
        <li><strong>Get an authenticator app</strong> on your phone, if you don’t have one: Google Authenticator, Microsoft Authenticator, Authy or 1Password all work.</li>
        <li><strong>Scan this code</strong> with it (or type the key underneath).</li>
        <li><strong>Type the 6-digit code</strong> the app shows for OGCW.</li>
      </ol>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {setup ? (
        <>
          <div className="twostep-qr">
            <img src={setup.qr} alt="QR code to add OGCW to your authenticator app" width={180} height={180} />
          </div>
          <p className="twostep-key">
            <span>Key</span>
            <code>{key}</code>
            <button type="button" aria-label="Copy the key" onClick={() => { void navigator.clipboard?.writeText(setup.secret).then(() => setCopied(true)); }}>
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            </button>
          </p>
          <CodeBoxes label="The 6-digit code from your authenticator app" onCode={async (code) => { await confirmTwoStep(setup.factorId, code); window.setTimeout(onDone, 600); }} />
        </>
      ) : (
        !error && <p className="authx-lede" role="status">Making your code…</p>
      )}
      {onCancel && <button type="button" className="auth-secondary authx-wide" onClick={onCancel}>Not now</button>}
    </div>
  );
}

/** A short line saying two-step login is on */
export const TwoStepOn = () => (
  <p className="twostep-on"><ShieldCheck size={16} strokeWidth={2} aria-hidden="true" /> Two-step login is on</p>
);

// ---------------------------------------------------------------- Google (and GitHub, if switched on for readers)

export const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/**
 * "Continue with Google" (always shown, owner 23 Oct 2026: until Google is
 * switched on in Supabase it says so instead of opening), and GitHub once
 * it's switched on. Either way the login comes back through the server
 * (/auth/confirm, a one-time PKCE key), and For Work still asks for the
 * account's 6-digit code after it.
 */
export function ProviderButtons({ returnTo, label = "Or continue with", onError }: { returnTo: string; label?: string; onError: (message: string) => void }) {
  const [providers, setProviders] = useState<Record<Provider, boolean> | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);
  useEffect(() => { void enabledProviders().then(setProviders); }, []);
  const go = async (provider: Provider) => {
    if (providers && !providers[provider]) {
      onError("Logging in with Google isn’t open yet. Log in with your email for now.");
      return;
    }
    setBusy(provider);
    try {
      await signInWith(provider, returnTo);
    } catch (problem) {
      onError(problem instanceof AccountError || problem instanceof Error ? problem.message : "That login didn’t work. Try again.");
      setBusy(null);
    }
  };
  return (
    <>
      <p className="authx-divider"><span>{label}</span></p>
      <div className="authx-providers">
        <button type="button" className="authx-provider" disabled={!!busy || !providers} onClick={() => void go("google")}><GoogleMark /> {busy === "google" ? "Opening Google…" : "Continue with Google"}</button>
        {providers?.github && <button type="button" className="authx-provider" disabled={!!busy} onClick={() => void go("github")}><GitHubMark /> {busy === "github" ? "Opening GitHub…" : "Continue with GitHub"}</button>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Cloudflare Turnstile ("are you human")
// Switched on by putting the widget's site key in VITE_TURNSTILE_SITE_KEY
// and its secret key in Supabase (Authentication → Attack Protection). Until
// then nothing shows and nothing is checked here (the server's own limits on
// tries still apply).

const SITE_KEY = (import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined) ?? "";
export const captchaOn = SITE_KEY.length > 0;
type TurnstileApi = { render: (el: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
let loading: Promise<TurnstileApi> | null = null;
function loadTurnstile() {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve((window as unknown as { turnstile: TurnstileApi }).turnstile);
    script.onerror = () => { loading = null; reject(new Error("The check didn’t load.")); };
    document.head.appendChild(script);
  });
  return loading;
}

/** The check; `onToken` gets a one-use pass ("" when it runs out). Remount it (a new key) after each try. */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  useEffect(() => {
    if (!captchaOn || !box.current) return;
    let id: string | null = null;
    let gone = false;
    void loadTurnstile().then((api) => {
      if (gone || !box.current) return;
      id = api.render(box.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        appearance: "interaction-only",
        callback: (token: string) => callback.current(token),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
    }).catch(() => {});
    return () => {
      gone = true;
      if (id) void loadTurnstile().then((api) => api.remove(id!)).catch(() => {});
    };
  }, []);
  if (!captchaOn) return null;
  return <div ref={box} className="turnstile" />;
}
