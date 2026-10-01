import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, LogOut } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { GitHubMark } from "../components/account-button";
import { signIn, signOut, signUp, useUser } from "../lib/auth";

// Sign in. Two doors: readers sign in or create an account with their email
// (src/lib/auth.ts), and the OGCW team signs in to the studio at /admin with
// GitHub, where every story is edited and published.

type Mode = "signin" | "signup";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode } => (search["mode"] === "signup" ? { mode: "signup" } : {}),
  head: () => ({
    meta: [
      { title: "Sign in — OGCW" },
      { name: "description", content: "Sign in to your OGCW account, or create one." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const { user, admin, ready } = useUser();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const switchTo = (next: Mode) => {
    setMode(next);
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") await signUp({ name, email, password });
      else await signIn({ email, password });
      setPassword("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <main className="page-wrap auth">
        <div className="auth-grid">
          <section className="auth-card" aria-labelledby="auth-title">
            {ready && user ? (
              <>
                <p className="og-kicker">Your OGCW account</p>
                <h1 id="auth-title" className="auth-title">You’re signed in</h1>
                <p className="auth-copy">Signed in as <strong>{user.name}</strong> ({user.email}).</p>
                <div className="auth-actions">
                  <Link to="/" className="auth-submit">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
                  <button type="button" className="auth-secondary" onClick={signOut}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Sign out</button>
                </div>
              </>
            ) : (
              <>
                <p className="og-kicker">Your OGCW account</p>
                <h1 id="auth-title" className="auth-title">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
                <div className="auth-tabs" role="group" aria-label="Sign in or create an account">
                  <button type="button" aria-pressed={mode === "signin"} onClick={() => switchTo("signin")}>Sign in</button>
                  <button type="button" aria-pressed={mode === "signup"} onClick={() => switchTo("signup")}>Create account</button>
                </div>

                <form className="auth-form" onSubmit={submit} noValidate>
                  {mode === "signup" && (
                    <label className="auth-field">
                      <span>Name</span>
                      <input type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
                    </label>
                  )}
                  <label className="auth-field">
                    <span>Email</span>
                    <input type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </label>
                  <label className="auth-field">
                    <span>Password</span>
                    <span className="auth-password">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        aria-describedby={mode === "signup" ? "password-hint" : undefined}
                      />
                      <button type="button" className="auth-reveal" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                        {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      </button>
                    </span>
                    {mode === "signup" && <span id="password-hint" className="auth-hint">At least 8 characters.</span>}
                  </label>
                  {error && <p className="auth-error" role="alert">{error}</p>}
                  <button type="submit" className="auth-submit" disabled={busy}>
                    {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
                    {!busy && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
                  </button>
                </form>

                <p className="auth-switch">
                  {mode === "signin" ? "New to OGCW? " : "Already have an account? "}
                  <button type="button" onClick={() => switchTo(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Sign in"}</button>
                </p>
              </>
            )}
          </section>

          <aside className="auth-card auth-admin" aria-labelledby="admin-title">
            <p className="og-kicker">The OGCW team</p>
            <h2 id="admin-title" className="auth-title auth-title-sm">Admin</h2>
            <p className="auth-copy">Write, edit and publish stories in the OGCW studio. Changes go live on the site as soon as you publish.</p>
            {/* A full page load: the studio is its own app */}
            <a href="/admin" className="auth-github">
              <GitHubMark />
              {admin ? "Open the studio" : "Sign in with GitHub"}
            </a>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
