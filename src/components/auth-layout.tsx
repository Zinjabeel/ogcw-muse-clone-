import { Link } from "@tanstack/react-router";
import { Clapperboard, Eye, EyeOff, Gamepad2, Music, Radio, Trophy } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SiteShell } from "./ogcw-layout";
import { Img } from "./cards";
import { formatDate, SECTIONS } from "@/data/content";
import { useStories } from "@/lib/stories";

// The frame for the account pages (/login, /signup, /reset-password and For
// Work at /work), after the Keylight sign-in page the owner picked (21 Oct
// 2026): a split screen. On the left, a dark panel over the latest stories'
// photos (one fading into the next), lit by a warm yellow glow that slowly
// swells and a cool light drifting below it; the OGCW mark, a headline, and
// the latest stories passing by as frosted glass cards (they stop while the
// pointer is on them), then the five desks. On the right, the form. Below
// 740px it's one column: the headline band, the form, then the cards.
// With reduced motion nothing moves. Only real stories are shown, never
// made-up quotes or customers.

const STEP_MS = 6000;
const DESK_ICONS = { music: Music, games: Gamepad2, streaming: Radio, culture: Clapperboard, sports: Trophy } as const;

const COPY = {
  reader: {
    title: "Every story. One login.",
    copy: "Rate stories, talk in the forum and keep your OGCW account on any device.",
  },
  work: {
    title: "The newsroom, one key away.",
    copy: "The newsroom’s tools: the studio, the front page and every story.",
  },
};

export function AuthLayout({ children, variant = "reader" }: { children: ReactNode; variant?: "reader" | "work" }) {
  const stories = useStories();
  const photos = stories.all.slice(0, 5);
  const cards = stories.all.slice(0, 6);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (photos.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % photos.length), STEP_MS);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  const words = COPY[variant];
  const card = (story: (typeof cards)[number], copy: boolean) => (
    <Link key={`${story.slug}${copy ? "-again" : ""}`} to="/news/$slug" params={{ slug: story.slug }} className="kl-card" aria-hidden={copy || undefined} tabIndex={copy ? -1 : undefined}>
      <span className="kl-card-kicker">{story.kicker}</span>
      <span className="kl-card-title">{story.title}</span>
      <span className="kl-card-who">
        <span className="kl-card-id">
          <span className="kl-card-name">{SECTIONS[story.section].label}</span>
          <span className="kl-card-role">{formatDate(story.date)}</span>
        </span>
        <Img photo={story.photo} className="kl-card-thumb" />
      </span>
    </Link>
  );

  return (
    <SiteShell>
      <main className={`kl kl-${variant}`}>
        {/* ---------------- The brand panel ---------------- */}
        <aside className="kl-brand" aria-label="About OGCW">
          <span className="kl-bg" aria-hidden="true">
            {photos.map((story, index) => (
              <img key={story.slug} src={story.photo.src} alt="" className={index === active ? "is-on" : undefined} style={{ objectPosition: story.photo.crop?.pos ?? "50% 50%" }} />
            ))}
          </span>
          <div className="kl-inset kl-top">
            <Link to="/" className="kl-logo" aria-label="OGCW front page">
              <span className="kl-logo-mark" aria-hidden="true">O</span>
              <span className="kl-logo-word">OGCW.</span>
              {variant === "work" && <span className="kl-logo-tag">for Work</span>}
            </Link>
          </div>

          <div className="kl-mid">
            <div className="kl-inset kl-hero">
              <h2 className="kl-hero-title">{words.title}</h2>
              <p className="kl-hero-copy">{words.copy}</p>
            </div>

            {cards.length > 0 && (
              <div className="kl-reel" aria-label="The latest on OGCW">
                <div className="kl-track">
                  {cards.map((story) => card(story, false))}
                  {cards.map((story) => card(story, true))}
                </div>
              </div>
            )}

            <div className="kl-inset kl-trust">
              <div className="kl-rule"><span>Five desks, one login</span></div>
              <div className="kl-marks">
                {(Object.keys(DESK_ICONS) as (keyof typeof DESK_ICONS)[]).map((id) => {
                  const Icon = DESK_ICONS[id];
                  return <span key={id} className="kl-mark"><Icon size={16} strokeWidth={2.2} aria-hidden="true" />{SECTIONS[id].label}</span>;
                })}
              </div>
            </div>
          </div>

          <div className="kl-inset kl-bottom">
            <p className="kl-legal">© <span suppressHydrationWarning>{new Date().getFullYear()}</span> One Great Culture World.</p>
          </div>
        </aside>

        {/* ---------------- The form ---------------- */}
        <section className="kl-auth">
          <div className="kl-main">
            <div className="kl-panel">{children}</div>
          </div>
          <nav className="kl-foot" aria-label="Legal">
            <Link to="/info/$slug" params={{ slug: "terms" }}>Terms</Link>
            <Link to="/info/$slug" params={{ slug: "privacy" }}>Privacy</Link>
            <Link to="/about">About</Link>
          </nav>
        </section>
      </main>
    </SiteShell>
  );
}

/** The password box with a show/hide button */
export function PasswordField({ label, value, onChange, autoComplete, hint }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string; hint?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-password">
        <input type={shown ? "text" : "password"} name="password" autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} required minLength={8} />
        <button type="button" className="auth-reveal" aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} onClick={() => setShown((open) => !open)}>
          {shown ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        </button>
      </span>
      {hint && <span className="auth-hint">{hint}</span>}
    </label>
  );
}
