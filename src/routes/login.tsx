import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { CodeStep, ProviderButtons, Turnstile } from "../components/account-kit";
import { signIn, signOut, useAccount } from "../lib/auth";

// Login for OGCW accounts. Creating an account has its own page (/signup);
// a forgotten password, /reset-password; the account itself, /account. The
// OGCW team logs in at For Work (/work), linked quietly at the bottom.
// With two-step login on, the password is followed by the 6-digit code from
// the authenticator app. A password found in a data breach still logs in,
// with a warning to change it.

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — OGCW" },
      { name: "description", content: "Log in to your OGCW account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [leaked, setLeaked] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [round, setRound] = useState(0);

  // Already logged in (and not halfway through a code): the account page
  useEffect(() => {
    if (account.ready && account.user && !account.needsCode && !leaked) void navigate({ to: "/account", replace: true });
  }, [account.ready, account.user, account.needsCode, leaked, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await signIn({ email, password, ...(captcha ? { captcha } : {}) });
      setPassword("");
      if (result.leaked) setLeaked(true);
      else if (!result.needsCode) void navigate({ to: "/" });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
      // A pass from the check works once: a fresh one for the next try
      setCaptcha("");
      setRound((value) => value + 1);
    }
  };

  return (
    <AuthLayout>
      <p className="og-kicker">Your OGCW account</p>
      {account.ready && account.user && account.needsCode ? (
        <CodeStep onDone={() => { if (!leaked) void navigate({ to: "/" }); }} onCancel={() => void signOut()} />
      ) : leaked && account.user ? (
        <>
          <span className="authx-icon authx-icon-warn"><ShieldAlert size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Change your password</h1>
          <p className="authx-lede" role="alert">You’re logged in, but that password has appeared in a data breach on another website, so someone could try it here. Choose a new one now: it takes a minute.</p>
          <div className="authx-actions">
            <Link to="/account" hash="password" className="auth-submit authx-wide">Choose a new password <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            <Link to="/" className="auth-secondary authx-wide">Later</Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="authx-title">Login</h1>
          <p className="authx-lede">Welcome back. Log in with the email you signed up with.</p>
          <form className="auth-form" onSubmit={submit} noValidate>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
            <Link to="/reset-password" className="authx-forgot">Forgot password?</Link>
            <Turnstile key={round} onToken={setCaptcha} />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>
              {busy ? "Logging in…" : "Login"}
              {!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
            </button>
          </form>
          <ProviderButtons returnTo="/" onError={setError} />
          <p className="kl-switch">New to OGCW? <Link to="/signup">Create an account</Link></p>
        </>
      )}
      <p className="authx-foot">Part of the OGCW team? <Link to="/work">For Work</Link></p>
    </AuthLayout>
  );
}
