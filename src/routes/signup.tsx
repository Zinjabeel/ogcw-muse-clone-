import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MailCheck, MessageSquareText } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import CodeSlots from "../components/code-slots";
import { CODE_LENGTH, phoneCodesEnabled, resendPhoneCode, signUp, signUpWithPhone, useUser, verifyPhoneCode } from "../lib/auth";

// Create an OGCW account: its own page, away from the login form.
// With text-message codes switched on in Supabase (owner, 21 Oct 2026), it
// asks for a phone number too, texts a 6-digit code, and the code goes into
// React Bits' code boxes (src/components/code-slots.tsx): right, and the
// account is made and logged in (with a link emailed to confirm the email
// address); wrong, and the boxes drain in red to try again. Until they're
// switched on, it's email only: Supabase sends a link to confirm the address
// before the first login.

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create an account — OGCW" },
      { name: "description", content: "Create a free OGCW account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

const RESEND_AFTER_S = 60;

function SignupPage() {
  const { user, ready } = useUser();
  const [withPhone, setWithPhone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  // The phone code step
  const [codeFor, setCodeFor] = useState<{ phone: string; email: string } | null>(null);
  const [codeStatus, setCodeStatus] = useState<"idle" | "error" | "success">("idle");
  const [codeMessage, setCodeMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [wait, setWait] = useState(0);
  const [done, setDone] = useState<{ email: string; emailProblem?: string } | null>(null);

  useEffect(() => { void phoneCodesEnabled().then(setWithPhone); }, []);
  // "Send a new code" waits a minute between texts
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!agreed) {
      setError("Tick the box to agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      if (withPhone) {
        const made = await signUpWithPhone({ name, email, phone, password });
        setCodeFor({ phone: made.phone, email: made.email });
        setCodeStatus("idle");
        setCodeMessage("");
        setWait(RESEND_AFTER_S);
      } else {
        const { confirm } = await signUp({ name, email, password });
        if (confirm) setSentTo(email.trim());
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const check = async (code: string) => {
    if (!codeFor || checking) return;
    setChecking(true);
    setCodeMessage("");
    try {
      const result = await verifyPhoneCode({ phone: codeFor.phone, code, email: codeFor.email });
      setCodeStatus("success");
      window.setTimeout(() => setDone({ email: codeFor.email, ...(result.emailProblem ? { emailProblem: result.emailProblem } : {}) }), 900);
    } catch (problem) {
      setCodeStatus("error");
      setCodeMessage(problem instanceof Error ? problem.message : "That code didn’t work. Try again.");
    } finally {
      setChecking(false);
    }
  };
  const resend = async () => {
    if (!codeFor || wait > 0) return;
    setCodeMessage("");
    try {
      await resendPhoneCode(codeFor.phone);
      setWait(RESEND_AFTER_S);
      setCodeStatus("idle");
      setCodeMessage("A new code is on its way.");
    } catch (problem) {
      setCodeMessage(problem instanceof Error ? problem.message : "We couldn’t send a new code. Try again.");
    }
  };

  return (
    <AuthLayout>
      <p className="og-kicker">Join OGCW</p>
      {done ? (
        <>
          <span className="authx-icon"><MailCheck size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">You’re in</h1>
          <p className="authx-lede" role="status">
            Your phone number is confirmed and you’re logged in.{" "}
            {done.emailProblem ? done.emailProblem : <>We’ve also sent a link to <strong>{done.email}</strong>: open it so you can log in with your email too.</>}
          </p>
          <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
        </>
      ) : codeFor ? (
        <>
          <span className="authx-icon"><MessageSquareText size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Enter the code</h1>
          <p className="authx-lede">We’ve texted a {CODE_LENGTH}-digit code to <strong>{codeFor.phone}</strong>. Type it here, or tap it in from your messages.</p>
          <div className="signup-code">
            <CodeSlots
              length={CODE_LENGTH}
              status={codeStatus}
              onChange={() => { if (codeStatus !== "success") setCodeStatus("idle"); }}
              onComplete={(code) => void check(code)}
              disabled={checking}
              autoFocus
              ariaLabel={`The ${CODE_LENGTH}-digit code we texted you`}
              accentColor="var(--ogcw-text)"
              inkColor="var(--ogcw-text)"
              slotColor="color-mix(in srgb, var(--ogcw-text) 7%, var(--ogcw-bg))"
              digitColor="var(--ogcw-bg)"
              dangerColor="#e5322d"
              slotSize={48}
              gap={9}
              radius={12}
              bounce={0.15}
              settle={0.35}
              rise={9}
              cascade={40}
            />
            {codeMessage && <p className={codeStatus === "error" ? "auth-error" : "authx-lede"} role={codeStatus === "error" ? "alert" : "status"}>{codeMessage}</p>}
            <div className="signup-code-row">
              <span>Didn’t get it?</span>
              <button type="button" disabled={wait > 0} onClick={() => void resend()}>{wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}</button>
              <button type="button" onClick={() => { setCodeFor(null); setCodeStatus("idle"); setCodeMessage(""); }}>Change the number</button>
            </div>
          </div>
        </>
      ) : sentTo ? (
        <>
          <span className="authx-icon"><MailCheck size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Check your email</h1>
          <p className="authx-lede" role="status">We’ve sent a link to <strong>{sentTo}</strong>. Open it to confirm your address, then log in on any device.</p>
          <Link to="/login" className="auth-secondary authx-wide">Back to login</Link>
        </>
      ) : ready && user ? (
        <>
          <h1 className="authx-title">You already have an account</h1>
          <p className="authx-lede">You’re logged in as <strong>{user.name}</strong>{user.email ? ` (${user.email})` : ""}.</p>
          <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
        </>
      ) : (
        <>
          <h1 className="authx-title">Create your account</h1>
          <p className="authx-lede">Free, and it works on any device.</p>
          <form className="auth-form" onSubmit={submit} noValidate>
            <label className="auth-field">
              <span>Name</span>
              <input type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
            </label>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {withPhone && (
              <label className="auth-field">
                <span>Phone number</span>
                <input type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="+44 7700 900123" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <span className="auth-hint">With your country code. We’ll text you a {CODE_LENGTH}-digit code.</span>
              </label>
            )}
            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." />
            <label className="authx-check">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I agree to the <Link to="/info/$slug" params={{ slug: "terms" }}>Terms of Service</Link> and the <Link to="/info/$slug" params={{ slug: "privacy" }}>Privacy Policy</Link>.</span>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>
              {busy ? "One moment…" : withPhone ? "Text me the code" : "Create account"}
              {!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
            </button>
          </form>
          <p className="authx-divider"><span>Already have an account?</span></p>
          <Link to="/login" className="auth-secondary authx-wide">Login</Link>
        </>
      )}
    </AuthLayout>
  );
}
