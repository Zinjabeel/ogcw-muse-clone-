import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LayoutDashboard, LogOut, Lock } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { GitHubMark } from "../components/account-button";
import { enabledProviders, signIn, signInWith, signOut, useUser, type Provider } from "../lib/auth";
import { useWorkAccess } from "../lib/work";

// For Work: the OGCW team's login, in place of a public admin page. Log in
// with Google, GitHub or email. The server checks the account: only the OGCW
// GitHub account gets the button into the admin dashboard (/admin); any
// other account is a normal OGCW reader account. /admin itself sends
// everyone else back here (src/components/studio-host.tsx).

export const Route = createFileRoute("/work")({
  validateSearch: (search: Record<string, unknown>): { from?: "admin" } => (search["from"] === "admin" ? { from: "admin" } : {}),
  head: () => ({
    meta: [
      { title: "For Work — OGCW" },
      { name: "description", content: "Work login for the OGCW team." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WorkPage,
});

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** An error Supabase sends back in the address after a Google or GitHub login */
function returnedError() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
  const description = params.get("error_description");
  if (!description) return "";
  return /not enabled|unsupported provider/i.test(description) ? "That login isn’t switched on yet." : "That login didn’t work. Try again.";
}

function WorkPage() {
  const search = Route.useSearch();
  const { user, ready } = useUser();
  const access = useWorkAccess();
  const [providers, setProviders] = useState<Record<Provider, boolean> | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void enabledProviders().then(setProviders);
    setError(returnedError());
  }, []);

  const withProvider = async (provider: Provider) => {
    setError("");
    setBusy(provider);
    try {
      await signInWith(provider, "/work");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That login didn’t work. Try again.");
      setBusy(null);
    }
  };
  const withEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy("email");
    try {
      await signIn({ email, password });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const loggedIn = ready && user;
  return (
    <AuthLayout variant="work">
      <p className="og-kicker">OGCW for Work</p>
      {access === "checking" ? (
        <>
          <h1 className="authx-title">One moment…</h1>
          <p className="authx-lede" role="status">Checking your work access.</p>
        </>
      ) : access === "admin" ? (
        // The OGCW GitHub account, or already logged in to the studio on this browser
        <>
          <span className="authx-icon"><LayoutDashboard size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Welcome back{user ? `, ${user.name}` : ""}</h1>
          <p className="authx-lede">Your account has admin access.</p>
          <div className="authx-actions">
            <Link to="/admin/$" params={{ _splat: "" }} className="auth-submit authx-wide">Open the admin dashboard <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            {user && <button type="button" className="auth-secondary authx-wide" onClick={() => void signOut()}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Log out</button>}
          </div>
        </>
      ) : loggedIn ? (
        <>
          <h1 className="authx-title">You’re logged in</h1>
          <p className="authx-lede">Logged in as <strong>{user.name}</strong> ({user.email}). This account doesn’t have work access, so it works as a normal OGCW account.</p>
          <div className="authx-actions">
            <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            <button type="button" className="auth-secondary authx-wide" onClick={() => void signOut()}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Log out</button>
          </div>
        </>
      ) : (
        <>
          <h1 className="authx-title">Work login</h1>
          <p className="authx-lede">{search.from === "admin" ? "That page is for the OGCW team. Log in with your work account to continue." : "For the OGCW team."}</p>
          <div className="authx-providers">
            <button type="button" className="authx-provider" disabled={!!busy || providers?.google === false} onClick={() => void withProvider("google")}>
              <GoogleMark /> {busy === "google" ? "Opening Google…" : "Continue with Google"}
              {providers?.google === false && <small>Not set up yet</small>}
            </button>
            <button type="button" className="authx-provider" disabled={!!busy || providers?.github === false} onClick={() => void withProvider("github")}>
              <GitHubMark /> {busy === "github" ? "Opening GitHub…" : "Continue with GitHub"}
              {providers?.github === false && <small>Not set up yet</small>}
            </button>
          </div>
          <p className="authx-divider"><span>or with email</span></p>
          <form className="auth-form" onSubmit={withEmail} noValidate>
            <label className="auth-field">
              <span>Work email</span>
              <input type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
            <Link to="/reset-password" className="authx-forgot">Forgot password?</Link>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={!!busy}>
              {busy === "email" ? "Logging in…" : "Login"}
              {busy !== "email" && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
            </button>
          </form>
          <p className="authx-note"><Lock size={13} strokeWidth={2} aria-hidden="true" /> Only approved OGCW team accounts open the admin dashboard. Any other account logs in as a normal OGCW account.</p>
        </>
      )}
      <p className="authx-foot">Not on the team? <Link to="/login">Reader login</Link></p>
    </AuthLayout>
  );
}
