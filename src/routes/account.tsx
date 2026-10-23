import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound, LayoutDashboard, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, PasswordField } from "../components/auth-layout";
import { CodeBoxes, CodeStep, PasswordStrength, Turnstile, TwoStepOn, TwoStepSetup } from "../components/account-kit";
import { checkPassword } from "../lib/password-rules";
import { AccountError, changePassword, setNewPassword, signOut, stopTwoStep, useAccount } from "../lib/auth";

// The reader's account (22 Oct 2026): who's logged in, two-step login (an
// authenticator app's 6-digit code after the password: on, off, set up),
// the password (change it, or add one to an account made with Google), and
// logging out here or on every device. An admin account sees whether its
// admin access is unlocked: it needs two-step login on and its code given.

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Your account — OGCW" }, { name: "description", content: "Your OGCW account: two-step login, your password and the devices you’re logged in on." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AccountPage,
});

function AccountPage() {
  const account = useAccount();
  const navigate = useNavigate();
  const [setting, setSetting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (account.ready && !account.user) void navigate({ to: "/login", replace: true });
  }, [account.ready, account.user, navigate]);
  // Arriving at #password (from the leaked-password warning): straight to it
  useEffect(() => {
    if (account.ready && account.user && window.location.hash === "#password") document.getElementById("password")?.scrollIntoView({ block: "start" });
  }, [account.ready, account.user]);

  if (!account.ready || !account.user) {
    return (
      <AuthLayout>
        <p className="og-kicker">Your OGCW account</p>
        <h1 className="authx-title">One moment…</h1>
      </AuthLayout>
    );
  }
  if (account.needsCode) {
    return (
      <AuthLayout>
        <p className="og-kicker">Your OGCW account</p>
        <CodeStep onDone={() => {}} onCancel={() => void signOut()} />
      </AuthLayout>
    );
  }
  const { user } = account;

  return (
    <AuthLayout>
      <p className="og-kicker">Your OGCW account</p>
      <h1 className="authx-title">Hi, {user.name}</h1>
      <p className="authx-lede">Logged in as <strong>{user.email}</strong>.</p>
      {notice && <p className="acct-notice" role="status">{notice}</p>}

      {(account.admin || account.adminLocked) && (
        <section className="acct-card" aria-labelledby="acct-admin">
          <h2 id="acct-admin" className="acct-heading"><LayoutDashboard size={17} strokeWidth={2} aria-hidden="true" /> Admin access</h2>
          {account.admin ? (
            <>
              <p className="acct-copy">Unlocked: you can edit the site and open the studio.</p>
              <Link to="/admin/$" params={{ _splat: "" }} className="auth-submit authx-wide">Open the admin dashboard <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            </>
          ) : (
            <p className="acct-copy">This account is an OGCW admin. To unlock it, turn on two-step login below: admin tools always need your password <em>and</em> the code from your phone.</p>
          )}
        </section>
      )}

      <section className="acct-card" aria-labelledby="acct-twostep">
        <h2 id="acct-twostep" className="acct-heading"><ShieldCheck size={17} strokeWidth={2} aria-hidden="true" /> Two-step login</h2>
        {account.twoStep ? (
          stopping ? (
            <>
              <p className="acct-copy">To turn it off, type the code from your authenticator app.</p>
              <CodeBoxes label="The 6-digit code from your authenticator app" onCode={async (code) => {
                await stopTwoStep(code);
                setStopping(false);
                setNotice("Two-step login is off. You can turn it on again any time.");
              }} />
              <button type="button" className="auth-secondary authx-wide" onClick={() => setStopping(false)}>Keep it on</button>
            </>
          ) : (
            <>
              <TwoStepOn />
              <p className="acct-copy">After your password, OGCW asks for the 6-digit code from your authenticator app, so your password alone can’t get anyone in.</p>
              <button type="button" className="auth-secondary authx-wide" onClick={() => setStopping(true)}>Turn off two-step login</button>
            </>
          )
        ) : setting ? (
          <TwoStepSetup onDone={() => { setSetting(false); setNotice("Two-step login is on. Next time, you’ll type a code from your app after your password."); }} onCancel={() => setSetting(false)} />
        ) : (
          <>
            <p className="acct-copy">Add a second step to your login: a 6-digit code from an app on your phone that changes every 30 seconds. Even someone with your password can’t get in without it.</p>
            <button type="button" className="auth-submit authx-wide" onClick={() => setSetting(true)}>Turn on two-step login <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></button>
          </>
        )}
      </section>

      <PasswordCard hasPassword={account.hasPassword} email={user.email} name={user.name} onSaved={(message) => setNotice(message)} />

      <section className="acct-card" aria-labelledby="acct-devices">
        <h2 id="acct-devices" className="acct-heading"><MonitorSmartphone size={17} strokeWidth={2} aria-hidden="true" /> Devices</h2>
        <p className="acct-copy">Logged in somewhere you shouldn’t be, or on a shared computer? Log out everywhere at once.</p>
        <div className="authx-actions">
          <button type="button" className="auth-secondary authx-wide" onClick={() => void signOut().then(() => navigate({ to: "/" }))}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Log out</button>
          <button type="button" className="auth-secondary authx-wide" onClick={() => void signOut({ everywhere: true }).then(() => navigate({ to: "/login" }))}><LogOut size={15} strokeWidth={2} aria-hidden="true" /> Log out of every device</button>
        </div>
      </section>
    </AuthLayout>
  );
}

function PasswordCard({ hasPassword, email, name, onSaved }: { hasPassword: boolean; email: string; name: string; onSaved: (message: string) => void }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [round, setRound] = useState(0);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const report = checkPassword(password, { email, name });
    if (report.problem) {
      setError(report.problem);
      return;
    }
    setBusy(true);
    try {
      if (hasPassword) await changePassword(current, password, captcha || undefined);
      else await setNewPassword(password);
      setCurrent("");
      setPassword("");
      onSaved("Password saved. Every other device logged in to this account has been logged out.");
    } catch (problem) {
      setError(problem instanceof AccountError || problem instanceof Error ? problem.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
      setCaptcha("");
      setRound((value) => value + 1);
    }
  };

  return (
    <section id="password" className="acct-card" aria-labelledby="acct-password">
      <h2 id="acct-password" className="acct-heading"><KeyRound size={17} strokeWidth={2} aria-hidden="true" /> {hasPassword ? "Change your password" : "Add a password"}</h2>
      {!hasPassword && <p className="acct-copy">You log in with Google. Add a password to log in with your email too.</p>}
      <form className="auth-form" onSubmit={save} noValidate>
        <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
        {hasPassword && <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />}
        <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordStrength password={password} email={email} name={name} />
        {hasPassword && <Turnstile key={round} onToken={setCaptcha} />}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-submit authx-wide" disabled={busy}>{busy ? "Saving…" : "Save the new password"}</button>
      </form>
    </section>
  );
}
