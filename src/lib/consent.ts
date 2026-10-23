// Cookie and storage consent. OGCW keeps a few small things in the browser
// (never tracking): what the site needs to work (the login cookie, the
// reader's consent choice and language, the voter number that makes a vote
// count once), which can't be turned off, and preferences (colour theme,
// hero and shop background, saved shop items and bag, remembered votes,
// answers and ratings, game scores), which are only stored with the reader's
// consent. There are no analytics or advertising cookies. The Cookie Policy
// (/info/cookies, src/components/info-pages.tsx) lists every item.

export const CONSENT_KEY = "ogcw-consent";
export const LANGUAGE_KEY = "ogcw-lang";
// Version 2 (22 Oct 2026): the list changed (login cookie, more preferences), so readers are asked again
const CONSENT_VERSION = 2;

export type Consent = { version: number; preferences: boolean; date: string };

// Storage keys that count as preferences (removed when preferences are turned off)
const PREFERENCE_KEYS = [
  /^ogcw-theme$/, /^ogcw-hero$/, /^ogcw-shop-backdrop$/, /^ogcw-shop-saved$/, /^ogcw-shop-cart$/,
  /^ogcw-vote-/, /^ogcw-answer-/, /^ogcw-poll-/, /^ogcw-rated$/, /^ogcw-ranking-vote$/, /^ogcw-404-best-/,
];

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Consent>;
    if (value.version !== CONSENT_VERSION || typeof value.preferences !== "boolean") return null;
    return { version: CONSENT_VERSION, preferences: value.preferences, date: String(value.date ?? "") };
  } catch {
    return null;
  }
}

export function saveConsent(preferences: boolean) {
  const consent: Consent = { version: CONSENT_VERSION, preferences, date: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    localStorage.setItem(LANGUAGE_KEY, "en");
    // Saying no to preferences removes any that were stored before
    if (!preferences) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && PREFERENCE_KEYS.some((pattern) => pattern.test(key))) localStorage.removeItem(key);
      }
    }
  } catch {
    // storage blocked: nothing is kept, which is the private choice anyway
  }
  window.dispatchEvent(new CustomEvent("ogcw-consent", { detail: consent }));
  return consent;
}

/** Whether preferences may be remembered in this browser */
export const allowPreferences = () => readConsent()?.preferences === true;

/** Store a preference only if the reader has allowed it */
export function storePreference(key: string, value: string) {
  if (!allowPreferences()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage blocked: the choice still applies for this visit
  }
}

/** Open the cookie settings again (the footer's "Cookie settings" link) */
export const openConsent = () => window.dispatchEvent(new Event("ogcw-open-consent"));
