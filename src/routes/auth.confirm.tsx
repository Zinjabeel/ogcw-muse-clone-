import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CircleAlert, MailCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthLayout } from "../components/auth-layout";
import { CodeStep } from "../components/account-kit";
import { adoptLinkTokens, confirmEmailLink, finishOAuth, takeNext } from "../lib/auth";

// Where every link from an OGCW email, and every Google login, lands
// (22 Oct 2026). It reads the address once, hands what it found to the
// server, which turns it into a login cookie (src/lib/server/account.server.ts),
// wipes it from the address bar, and moves on:
//   ?token_hash=…&type=…   our own emails (emails/*.html): confirm, reset, change email
//   #access_token=…        Supabase's standard emails, until ours are in place
//   ?code=…                back from Google
//   error=…                something went wrong on the way
// A reset link goes on to choose a new password; a confirmed email says so.
// If two-step login is on, the 6-digit code comes first.

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({ meta: [{ title: "One moment — OGCW" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ConfirmPage,
});

type Stage =
  | { kind: "working" }
  | { kind: "code"; then: () => void }
  | { kind: "confirmed"; partial?: boolean }
  | { kind: "failed"; message: string };

const TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
type LinkType = (typeof TYPES)[number];

function ConfirmPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>({ kind: "working" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    // The keys are taken out of the address straight away
    history.replaceState(history.state, "", window.location.pathname);

    const go = (href: string) => void navigate({ href, replace: true });
    const after = (type: string | null, needsCode: boolean, partial?: boolean) => {
      const next = () => {
        if (type === "recovery") return void navigate({ to: "/reset-password", search: { stage: "choose" }, replace: true });
        if (type === "signup" || type === "email" || type === "email_change" || type === "invite") return setStage({ kind: "confirmed", ...(partial ? { partial } : {}) });
        go(takeNext());
      };
      if (needsCode) setStage({ kind: "code", then: next });
      else next();
    };
    const failed = (problem: unknown) => setStage({ kind: "failed", message: problem instanceof Error ? problem.message : "This link didn’t work. Ask for a new one." });

    const error = query.get("error_description") ?? hash.get("error_description");
    const tokenHash = query.get("token_hash");
    const type = query.get("type") ?? hash.get("type");
    const code = query.get("code");
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    if (error) {
      failed(new Error(/expired|invalid/i.test(error) ? "This link has expired or was already used. Ask for a new one." : /not enabled|provider/i.test(error) ? "That login isn’t switched on yet." : "That didn’t go through. Try again."));
    } else if (tokenHash && TYPES.includes(type as LinkType)) {
      confirmEmailLink(tokenHash, type as LinkType).then((answer) => after(answer.type, answer.needsCode, answer.partial), failed);
    } else if (accessToken && refreshToken) {
      adoptLinkTokens(accessToken, refreshToken, type ?? undefined).then((answer) => after(type, answer.needsCode), failed);
    } else if (code) {
      finishOAuth(code).then((answer) => after(null, answer.needsCode), failed);
    } else {
      go("/login");
    }
  }, [navigate]);

  return (
    <AuthLayout>
      <p className="og-kicker">Your OGCW account</p>
      {stage.kind === "working" && (
        <>
          <h1 className="authx-title">One moment…</h1>
          <p className="authx-lede" role="status">Checking your link.</p>
        </>
      )}
      {stage.kind === "code" && <CodeStep onDone={stage.then} />}
      {stage.kind === "confirmed" && (
        <>
          <span className="authx-icon"><MailCheck size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">{stage.partial ? "One more step" : "Email confirmed"}</h1>
          <p className="authx-lede" role="status">
            {stage.partial ? "That address is confirmed. Now open the link we sent to your other address to finish the change." : "Thanks: your address is confirmed and you’re logged in on this device. On any other device, log in with your email and password."}
          </p>
          <Link to="/" className="auth-submit authx-wide">Go to the front page <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
          <Link to="/account" className="auth-secondary authx-wide">Your account</Link>
        </>
      )}
      {stage.kind === "failed" && (
        <>
          <span className="authx-icon authx-icon-warn"><CircleAlert size={22} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 className="authx-title">That link didn’t work</h1>
          <p className="authx-lede" role="alert">{stage.message}</p>
          <div className="authx-actions">
            <Link to="/login" className="auth-submit authx-wide">Go to login <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
            <Link to="/reset-password" className="auth-secondary authx-wide">Send a new password link</Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
