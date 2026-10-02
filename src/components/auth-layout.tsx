import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SiteShell } from "./ogcw-layout";
import { useStories } from "@/lib/stories";

// The frame for the account pages (/login, /signup, /reset-password and For
// Work at /work): the form on the right, and on the left the latest stories'
// photos fading one into the next every 3 seconds with the headline under
// them, or, for For Work, a plain dark panel. On phones the panel becomes a
// slim strip above the form.

const STEP_MS = 3000;

export function AuthLayout({ children, variant = "reader" }: { children: ReactNode; variant?: "reader" | "work" }) {
  const stories = useStories();
  const photos = stories.all.slice(0, 5);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (variant !== "reader" || photos.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % photos.length), STEP_MS);
    return () => window.clearInterval(timer);
  }, [variant, photos.length]);

  const shown = photos[active] ?? photos[0];
  return (
    <SiteShell>
      <main className={`authx authx-${variant}`}>
        <div className="authx-frame">
          <aside className="authx-visual" aria-hidden="true">
            {variant === "reader" ? (
              photos.map((story, index) => (
                <img key={story.slug} src={story.photo.src} alt="" className={index === active ? "is-on" : undefined} style={{ objectPosition: story.photo.crop?.pos ?? "50% 50%" }} />
              ))
            ) : (
              <span className="authx-lines" />
            )}
            <div className="authx-visual-copy">
              <span className="authx-mark">OGCW{variant === "work" && <em>for Work</em>}</span>
              {variant === "reader" && shown ? (
                <p key={shown.slug} className="authx-caption"><span>{shown.kicker}</span>{shown.title}</p>
              ) : (
                <p className="authx-caption authx-caption-work">The newsroom’s tools: the studio, the front page and every story.</p>
              )}
            </div>
          </aside>
          <section className="authx-panel">{children}</section>
        </div>
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
        <button type="button" className="auth-reveal" aria-label={shown ? "Hide password" : "Show password"} onClick={() => setShown((open) => !open)}>
          {shown ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </span>
      {hint && <span className="auth-hint">{hint}</span>}
    </label>
  );
}
