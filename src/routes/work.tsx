import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, LayoutDashboard, Lock, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { GitHubMark } from "../components/account-button";
import { CodeStep, ProviderButtons, Turnstile, TwoStepSetup } from "../components/account-kit";
import { signIn, signOut, useAccount } from "../lib/auth";
import { finishStudioLogin, studioLogin, studioLogout, useWorkAccess } from "../lib/work";

// For Work: the OGCW team's login (rebuilt 22 Oct 2026, in place of the
// 6-digit admin password). Admin access always takes two things: an OGCW
// account on the server's admin list (OGCW_ADMIN_EMAILS), logged in with its
// password or Google, AND the 6-digit code from that account's authenticator
// app, which changes every 30 seconds. An admin account without two-step
// login is asked to set it up here first. "Continue with GitHub" logs in to
// the studio through Sanity, as before (members of the OGCW Sanity project).
// Any other account is a normal reader account. /admin sends everyone else
// back here (src/components/studio-host.tsx).

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

function WorkPage() {
  const search = Route.useSearch();
  const account = useAccount();
  const access = useWorkAccess();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [round, setRound] = useState(0);

  useEffect(() => {
    finishStudioLogin().catch((problem: unknown) => setError(problem instanceof Error ? problem.message : "The GitHub login didn’t go through. Try again."));
  }, []);

  // Sent here from /admin: once the login gives admin access, carry on there
  useEffect(() => {
    if (access === "admin" && search.from === "admin") void navigate({ to: "/admin/$", params: { _splat: "" }, replace: true });
  }, [access, search.from, navigate]);

  const withGitHub = () => {
    setError("");
    setBusy("github");
    studioLogin(search.from === "admin" ? "/work?from=admin" : "/work");
  };
  const withEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy("email");
    try {
      await signIn({ email, password, ...(captcha ? { captcha } : {}) });
      setPassword("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
      setCaptcha("");
      setRound((value) => value + 1);
    }
  };
  const logOutAll = () => {
    studioLogout();
    void signOut().finally(() => window.location.reload());
  };

  return (
    <AuthLayout variant="work">
      <p className="og-kicker">OGCW for Work</p>
      {access === "checking" ? (
        <>
          <h1 className="authx-title">One moment…</h1>
          <p className="authx-lede" role="status">Checking your work access.</p>
        </>
      ) : account.user && account.needsCode ? (
        // Password right: now the code from the phone
        <CodeStep onDone={() => {}} onCancel={() => void signOut()} />
      ) : access === "admin" ? (
        <>
          <span className="authx-icon"><LayoutDashboard size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Welcome back{account.user ? `, ${account.user.name}` : ""}</h1>
          <p className="authx-lede">{account.admin ? <><ShieldCheck size={15} strokeWidth={2} aria-hidden="true" className="authx-inline-icon" /> Admin access is unlocked with your two-step code.</> : "You’re logged in to the studio on this browser."}</p>
          <div className="authx-actions">
            <Link to="/admin/$" params={{ _splat: "" }} className="auth-submit authx-wide">Open the admin dashboard <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            <button type="button" className="auth-secondary authx-wide" onClick={logOutAll}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Log out</button>
          </div>
        </>
      ) : account.user && account.adminLocked ? (
        // An admin account without two-step login yet: set it up to unlock admin
        <>
          <span className="authx-icon"><ShieldCheck size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">Turn on two-step login</h1>
          <p className="authx-lede">Your account has admin access. Admin tools always need your password and a code from your phone, so set that up once now: it takes a minute.</p>
          <TwoStepSetup onDone={() => {}} onCancel={() => void signOut()} />
        </>
      ) : account.user ? (
        <>
          <h1 className="authx-title">You’re logged in</h1>
          <p className="authx-lede">Logged in as <strong>{account.user.name}</strong> ({account.user.email}). This account doesn’t have work access, so it works as a normal OGCW account.</p>
          <div className="authx-actions">
            <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            <button type="button" className="auth-secondary authx-wide" onClick={() => void signOut()}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Log out</button>
          </div>
        </>
      ) : (
        <>
          <h1 className="authx-title">Work login</h1>
          <p className="authx-lede">{search.from === "admin" ? "That page is for the OGCW team. Log in with your work account to continue." : "For the OGCW team."}</p>
          <form className="auth-form" onSubmit={withEmail} noValidate>
            <label className="auth-field">
              <span>Work email</span>
              <input type="email" name="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
            <Link to="/reset-password" className="authx-forgot">Forgot password?</Link>
            <Turnstile key={round} onToken={setCaptcha} />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit authx-wide" disabled={!!busy}>
              {busy === "email" ? "Logging in…" : "Login"}
              {busy !== "email" && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
            </button>
          </form>
          <ProviderButtons returnTo={search.from === "admin" ? "/work?from=admin" : "/work"} onError={setError} />
          <p className="authx-divider"><span>The studio</span></p>
          <div className="authx-providers">
            <button type="button" className="authx-provider" disabled={!!busy} onClick={withGitHub}>
              <GitHubMark /> {busy === "github" ? "Opening GitHub…" : "Continue with GitHub"}
            </button>
          </div>
          <p className="authx-note"><Lock size={13} strokeWidth={2} aria-hidden="true" /> Admin access needs an approved OGCW team account and the 6-digit code from its authenticator app. Any other account logs in as a normal OGCW account.</p>
        </>
      )}
      <div className="authx-actions" style={{ marginTop: 22 }}>\n        <Link to="/cms-demo" className="auth-secondary authx-wide" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>\n          <Eye size={16} /> Enter Demo CMS\n        </Link>\n        <p className="authx-note">Explore a safe interactive preview. Changes are temporary and never saved.</p>\n      </div>\n      <p className="authx-foot">Not on the team? <Link to="/login">Reader login</Link></p>
    </AuthLayout>
  );
}
