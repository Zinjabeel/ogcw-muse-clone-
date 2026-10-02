import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MailCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { sendPasswordReset, setNewPassword } from "../lib/auth";
import { getSupabase } from "../lib/supabase";

// A forgotten password: ask for a link by email; the link comes back here,
// logged in for this one purpose, to choose a new password.

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — OGCW" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const [stage, setStage] = useState<"ask" | "sent" | "choose" | "done">("ask");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Opened from the email: Supabase reads the link and says so
  useEffect(() => {
    const { data } = getSupabase().auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setStage("choose"); });
    return () => data.subscription.unsubscribe();
  }, []);

  const run = (task: () => Promise<void>, next: typeof stage) => async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await task();
      setStage(next);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <p className="og-kicker">Your OGCW account</p>
      {stage === "ask" && (
        <>
          <h1 className="authx-title">Reset your password</h1>
          <p className="authx-lede">Type the email you signed up with and we’ll send you a link to choose a new password.</p>
          <form className="auth-form" onSubmit={run(() => sendPasswordReset(email), "sent")} noValidate>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>{busy ? "Sending…" : "Send the link"}{!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}</button>
          </form>
        </>
      )}
      {stage === "sent" && (
        <>
          <span className="authx-icon"><MailCheck size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Check your email</h1>
          <p className="authx-lede" role="status">If there’s an OGCW account for <strong>{email.trim()}</strong>, a link to choose a new password is on its way.</p>
        </>
      )}
      {stage === "choose" && (
        <>
          <h1 className="authx-title">Choose a new password</h1>
          <form className="auth-form" onSubmit={run(() => setNewPassword(password), "done")} noValidate>
            <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>{busy ? "Saving…" : "Save the new password"}{!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}</button>
          </form>
        </>
      )}
      {stage === "done" && (
        <>
          <h1 className="authx-title">Password changed</h1>
          <p className="authx-lede" role="status">You’re logged in with your new password.</p>
          <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
        </>
      )}
      <p className="authx-foot"><Link to="/login">Back to login</Link></p>
    </AuthLayout>
  );
}
