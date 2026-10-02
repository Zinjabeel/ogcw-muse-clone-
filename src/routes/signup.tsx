import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { signUp, useUser } from "../lib/auth";

// Create an OGCW account: its own page, away from the login form. Supabase
// sends a link to confirm the email address before the first login.

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

function SignupPage() {
  const { user, ready } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!agreed) {
      setError("Tick the box to agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      const { confirm } = await signUp({ name, email, password });
      if (confirm) setSentTo(email.trim());
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <p className="og-kicker">Join OGCW</p>
      {sentTo ? (
        <>
          <span className="authx-icon"><MailCheck size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Check your email</h1>
          <p className="authx-lede" role="status">We’ve sent a link to <strong>{sentTo}</strong>. Open it to confirm your address, then log in on any device.</p>
          <Link to="/login" className="auth-secondary authx-wide">Back to login</Link>
        </>
      ) : ready && user ? (
        <>
          <h1 className="authx-title">You already have an account</h1>
          <p className="authx-lede">You’re logged in as <strong>{user.name}</strong> ({user.email}).</p>
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
            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." />
            <label className="authx-check">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I agree to the <Link to="/info/$slug" params={{ slug: "terms" }}>Terms of Service</Link> and the <Link to="/info/$slug" params={{ slug: "privacy" }}>Privacy Policy</Link>.</span>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={busy}>
              {busy ? "One moment…" : "Create account"}
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
