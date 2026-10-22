import { checkPassword } from "../password-rules";

// The server's password check: OGCW's rules (src/lib/password-rules.ts),
// then Have I Been Pwned's list of passwords leaked in data breaches. Only
// the first 5 characters of the password's SHA-1 fingerprint are sent
// ("k-anonymity"); the list of matching fingerprints comes back and is
// compared here, so neither the password nor its fingerprint leaves OGCW.
// If the list can't be reached in time, the rules alone decide.

export async function leakCount(password: string): Promise<number> {
  try {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, {
      headers: { "Add-Padding": "true", "User-Agent": "OGCW password check" },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return 0;
    const suffix = hex.slice(5);
    for (const line of (await response.text()).split("\n")) {
      const [hash, times] = line.trim().split(":");
      if (hash === suffix) return Number(times) || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/** null if the password is fine, otherwise what's wrong with it, in words */
export async function passwordProblem(password: string, about: { email?: string; name?: string }): Promise<string | null> {
  const report = checkPassword(password, about);
  if (report.problem) return report.problem;
  if ((await leakCount(password)) > 0) return "That password has appeared in a data breach, so it isn’t safe to use. Choose a different one.";
  return null;
}
