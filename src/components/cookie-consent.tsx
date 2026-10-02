import { Link } from "@tanstack/react-router";
import { Cookie, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { readConsent, saveConsent } from "@/lib/consent";
import { T } from "./site-text";

// The welcome panel every new visitor sees: pick a language (English, for
// now) and choose which browser storage OGCW may use. "Accept all" and
// "Reject optional" answer in one click; "Settings" shows each category.
// OGCW has no analytics or advertising cookies, so those are listed as not
// used rather than offered. The choice is kept, and the panel opens again
// from "Cookie settings" in the footer and the menu.

export const LANGUAGES = [{ code: "en", name: "English", native: "English" }] as const;

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const panel = useRef<HTMLDivElement>(null);

  // First visit: open once the page has settled
  useEffect(() => {
    const saved = readConsent();
    if (saved) {
      setPreferences(saved.preferences);
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, []);

  // "Cookie settings" anywhere on the site opens it again, on the settings view
  useEffect(() => {
    const reopen = () => {
      setPreferences(readConsent()?.preferences ?? true);
      setSettings(true);
      setOpen(true);
    };
    window.addEventListener("ogcw-open-consent", reopen);
    return () => window.removeEventListener("ogcw-open-consent", reopen);
  }, []);

  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>("select, button")?.focus({ preventScroll: true });
  }, [open, settings]);

  const choose = (allowPreferences: boolean) => {
    saveConsent(allowPreferences);
    setOpen(false);
    setSettings(false);
  };

  if (!open) return null;

  return (
    <div ref={panel} className="consent" role="dialog" aria-modal="false" aria-labelledby="consent-title" aria-describedby="consent-copy">
      <div className="consent-top">
        <p className="consent-kicker"><Cookie size={14} strokeWidth={2} aria-hidden="true" /> <T>Welcome to OGCW</T></p>
        <label className="consent-language">
          <Globe size={14} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only"><T>Language</T></span>
          <select defaultValue="en" aria-label="Language">
            {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.native}</option>)}
          </select>
        </label>
      </div>

      <h2 id="consent-title" className="consent-title">{settings ? "Cookie settings" : "Your privacy, your choice"}</h2>

      {!settings ? (
        <>
          <p id="consent-copy" className="consent-copy">
            <T>OGCW keeps a few small files in your browser to make the site work and, if you allow it, to remember your preferences, like your colour theme and your votes. We don’t use advertising or tracking cookies. Read the</T> <Link to="/info/$slug" params={{ slug: "cookies" }} onClick={() => setOpen(false)}>Cookie Policy</Link>.
          </p>
          <div className="consent-actions">
            <button type="button" className="consent-primary" onClick={() => choose(true)}>Accept all</button>
            <button type="button" className="consent-secondary" onClick={() => choose(false)}>Reject optional</button>
            <button type="button" className="consent-link" onClick={() => setSettings(true)}>Settings</button>
          </div>
        </>
      ) : (
        <>
          <p id="consent-copy" className="consent-copy"><T>Choose what OGCW may store in this browser. You can change this at any time from “Cookie settings” in the footer.</T></p>
          <ul className="consent-list">
            <li>
              <div><strong><T>Strictly necessary</T></strong><span><T>Remembers this choice and your language. The site needs these to work.</T></span></div>
              <span className="consent-always"><T>Always on</T></span>
            </li>
            <li>
              <div><strong><T>Preferences</T></strong><span><T>Your colour theme, your choice of home page hero, and the votes and answers you have given, so you see the results when you come back.</T></span></div>
              <button type="button" role="switch" aria-checked={preferences} aria-label="Preferences" className="consent-switch" onClick={() => setPreferences((value) => !value)}><i aria-hidden="true" /></button>
            </li>
            <li className="consent-off">
              <div><strong><T>Analytics</T></strong><span><T>Not used. OGCW does not measure visits with analytics cookies.</T></span></div>
              <span className="consent-always"><T>Not used</T></span>
            </li>
            <li className="consent-off">
              <div><strong><T>Advertising</T></strong><span><T>Not used. OGCW does not use advertising or tracking cookies.</T></span></div>
              <span className="consent-always"><T>Not used</T></span>
            </li>
          </ul>
          <div className="consent-actions">
            <button type="button" className="consent-primary" onClick={() => choose(preferences)}>Save choices</button>
            <button type="button" className="consent-secondary" onClick={() => choose(true)}>Accept all</button>
          </div>
        </>
      )}
    </div>
  );
}

/** The language menu in the footer: English is the only language for now */
export function LanguagePicker() {
  return (
    <label className="lang-picker">
      <Globe size={15} strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only"><T>Language</T></span>
      <select defaultValue="en" aria-label="Language">
        {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.native}</option>)}
      </select>
    </label>
  );
}
