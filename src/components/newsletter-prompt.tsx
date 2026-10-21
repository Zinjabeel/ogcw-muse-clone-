import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BellToggle from "./bell-toggle";
import { T } from "./site-text";
import { useUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// After a reader logs in (owner, 21 Oct 2026): "Subscribe to our newsletter"
// in the middle of the screen, with React Bits' bell button beside it
// (src/components/bell-toggle.tsx). Ringing the bell signs up the address
// they logged in with, into the same list as the newsletter form
// (newsletter_signups, through newsletter_signup). Each account is asked once
// on this browser; "Not now", Escape or a click outside closes it.

const ASKED = (id: string) => `ogcw-newsletter-asked:${id}`;
const DELAY_MS = 700;

export function NewsletterPrompt() {
  const { user, ready } = useUser();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const card = useRef<HTMLDivElement>(null);
  const before = useRef<HTMLElement | null>(null);

  // Once logged in, ask (unless this account was asked on this browser)
  useEffect(() => {
    if (!ready || !user || pathname.startsWith("/admin")) return;
    let asked = true;
    try { asked = localStorage.getItem(ASKED(user.id)) === "1"; } catch { /* can't remember: don't nag */ }
    if (asked) return;
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(ASKED(user.id), "1"); } catch { /* asked once this visit */ }
      before.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ready, user, pathname]);

  const close = () => {
    setOpen(false);
    before.current?.focus?.();
  };
  useEffect(() => {
    if (!open) return;
    card.current?.querySelector<HTMLElement>(".bell-toggle__button")?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !user) return null;

  const subscribe = async () => {
    if (state === "saving" || state === "done") return;
    setState("saving");
    const { error } = await getSupabase().rpc("newsletter_signup", { p_email: user.email, p_source: "after-login" });
    setState(error ? "error" : "done");
  };

  return (
    <div className="nlp" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={card} className="nlp-card" role="dialog" aria-modal="true" aria-labelledby="nlp-title" aria-describedby="nlp-copy">
        <button type="button" className="nlp-close" aria-label="Close" onClick={close}><X size={16} aria-hidden="true" /></button>
        <div className="nlp-words">
          <p className="nlp-kicker"><T k="newsletter.prompt.kicker">Newsletter</T></p>
          <h2 id="nlp-title" className="nlp-title"><T k="newsletter.prompt.title">Subscribe to our newsletter</T></h2>
          <p id="nlp-copy" className="nlp-copy"><T k="connect.newsletter.copy">Get the biggest stories from OGCW directly to your inbox.</T></p>
          <p className="nlp-to">
            {state === "done" ? <>Done: it goes to <strong>{user.email}</strong>.</> : state === "error" ? <span role="alert">That didn’t go through. Ring the bell again.</span> : <>It goes to <strong>{user.email}</strong>.</>}
          </p>
        </div>
        <div className="nlp-action">
          <BellToggle
            offLabel="Subscribe"
            onLabel="You’re subscribed"
            label="Subscribe to the OGCW newsletter"
            color="var(--ogcw-bg)"
            background="var(--ogcw-text)"
            onColor="#0d0d0d"
            onBackground="#ffe600"
            size="lg"
            radius={16}
            ringAmplitude={17}
            ringPasses={6}
            ringDecay={0.8}
            ringDuration={960}
            ringPivot={16}
            crossfadeMs={210}
            badge={false}
            waves
            pressed={state === "saving" || state === "done"}
            disabled={state === "saving" || state === "done"}
            onChange={(pressed) => { if (pressed) void subscribe(); }}
          />
          <button type="button" className="nlp-later" onClick={close}>{state === "done" ? "Close" : "Not now"}</button>
        </div>
      </div>
    </div>
  );
}
