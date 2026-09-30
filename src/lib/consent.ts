// Cookie and storage consent. OGCW keeps a few small things in the browser
// (never tracking): the reader's consent choice and language, which are
// strictly necessary, and preferences (colour theme, hero choice, remembered
// votes and answers), which are only stored with the reader's consent. There
// are no analytics or advertising cookies. The Cookie Policy (/info/cookies)
// lists every item.

export const CONSENT_KEY = "ogcw-consent";
export const LANGUAGE_KEY = "ogcw-lang";
const CONSENT_VERSION = 1;

export type Consent = { version: number; preferences: boolean; date: string };

// Storage keys that count as preferences
const PREFERENCE_KEYS = [/^ogcw-theme$/, /^ogcw-hero$/, /^ogcw-vote-/, /^ogcw-answer-/];

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
