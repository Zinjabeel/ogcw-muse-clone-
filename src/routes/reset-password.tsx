import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { CodeStep, PasswordStrength, Turnstile } from "../components/account-kit";
import { checkPassword } from "../lib/password-rules";
import { AccountError, sendPasswordReset, setNewPassword, useAccount } from "../lib/auth";

// A forgotten password: ask for a link by email. The link opens /auth/confirm,
// which logs the reader in for this one purpose and brings them back here
// (?stage=choose) to choose a new password; every other device the account
// was logged in on is logged out. The page says the email is on its way
// whether or not the address has an account, so nobody can use it to find
// out who's signed up.

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { stage?: "choose" } => (search["stage"] === "choose" ? { stage: "choose" } : {}),
  head: () => ({
    meta: [
      { title: "Reset your password — OGCW" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const search = Route.useSearch();
  const account = useAccount();
  const [stage, setStage] = useState<"ask" | "sent" | "choose" | "done">(search.stage === "choose" ? "choose" : "ask");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [round, setRound] = useState(0);

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await sendPasswordReset(email, captcha || undefined);
      setStage("sent");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
      setCaptcha("");
      setRound((value) => value + 1);
    }
  };

  const choose = async (event?: FormEvent) => {
    event?.preventDefault();
    setError("");
    const report = checkPassword(password, { email: account.user?.email ?? "", name: account.user?.name ?? "" });
    if (report.problem) {
      setError(report.problem);
      return;
    }
    setBusy(true);
    try {
      await setNewPassword(password);
      setPassword("");
      setStage("done");
    } catch (problem) {
      if (problem instanceof AccountError && problem.needsCode) setNeedsCode(true);
      else setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
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
          <form className="auth-form" onSubmit={ask} noValidate>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <Turnstile key={round} onToken={setCaptcha} />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>{busy ? "Sending…" : "Send the link"}{!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}</button>
          </form>
        </>
      )}
      {stage === "sent" && (
        <>
          <span className="authx-icon"><MailCheck size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Check your email</h1>
          <p className="authx-lede" role="status">If there’s an OGCW account for <strong>{email.trim()}</strong>, a link to choose a new password is on its way. It works once, for an hour. Check your spam folder if it isn’t there in a few minutes.</p>
          <button type="button" className="auth-secondary authx-wide" onClick={() => setStage("ask")}>Use a different email</button>
        </>
      )}
      {stage === "choose" && (needsCode ? (
        <CodeStep onDone={() => { setNeedsCode(false); void choose(); }} />
      ) : !account.ready ? (
        <p className="authx-lede" role="status">One moment…</p>
      ) : !account.user ? (
        <>
          <h1 className="authx-title">That link has run out</h1>
          <p className="authx-lede">Reset links work once, for an hour. Ask for a new one and open it on this device.</p>
          <button type="button" className="auth-submit authx-wide" onClick={() => setStage("ask")}>Send a new link <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></button>
        </>
      ) : (
        <>
          <h1 className="authx-title">Choose a new password</h1>
          <p className="authx-lede">For <strong>{account.user.email}</strong>. Once it’s saved, every other device logged in to this account is logged out.</p>
          <form className="auth-form" onSubmit={choose} noValidate>
            <input type="email" name="email" autoComplete="username" value={account.user.email} readOnly hidden />
            <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
            <PasswordStrength password={password} email={account.user.email} name={account.user.name} />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>{busy ? "Saving…" : "Save the new password"}{!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}</button>
          </form>
        </>
      ))}
      {stage === "done" && (
        <>
          <h1 className="authx-title">Password changed</h1>
          <p className="authx-lede" role="status">You’re logged in with your new password, and logged out everywhere else.</p>
          <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
        </>
      )}
      <p className="authx-foot"><Link to="/login">Back to login</Link></p>
    </AuthLayout>
  );
}
