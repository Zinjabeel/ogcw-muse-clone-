import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LogOut } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { signIn, signOut, useUser } from "../lib/auth";

// Login for OGCW accounts. Creating an account has its own page (/signup);
// a forgotten password, /reset-password. The OGCW team logs in at For Work
// (/work), linked quietly at the bottom.

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
  const { user, ready } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn({ email, password });
      void navigate({ to: "/" });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <p className="og-kicker">Your OGCW account</p>
      {ready && user ? (
        <>
          <h1 className="authx-title">You’re logged in</h1>
          <p className="authx-lede">Logged in as <strong>{user.name}</strong> ({user.email}).</p>
          <div className="authx-actions">
            <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            <button type="button" className="auth-secondary authx-wide" onClick={() => void signOut()}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Log out</button>
          </div>
        </>
      ) : (
        <>
          <h1 className="authx-title">Login</h1>
          <p className="authx-lede">Welcome back. Log in with the email you signed up with.</p>
          <form className="auth-form" onSubmit={submit} noValidate>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
            <Link to="/reset-password" className="authx-forgot">Forgot password?</Link>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>
              {busy ? "Logging in…" : "Login"}
              {!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
            </button>
          </form>
          <p className="authx-divider"><span>New to OGCW?</span></p>
          <Link to="/signup" className="auth-secondary authx-wide">Create an account</Link>
        </>
      )}
      <p className="authx-foot">Part of the OGCW team? <Link to="/work">For Work</Link></p>
    </AuthLayout>
  );
}
