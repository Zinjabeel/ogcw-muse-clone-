// OGCW's password rules (22 Oct 2026), the same on the page (the meter under
// the password box) and on the server, which has the final say. A password
// needs 12 or more characters, letters and numbers, and mustn't be a
// well-known password or contain the person's name or email. The server
// also checks it against Have I Been Pwned's list of leaked passwords
// (src/lib/server/passwords.server.ts).

export const PASSWORD_MIN = 12;
// Supabase keeps passwords with bcrypt, which reads at most 72 bytes
export const PASSWORD_MAX = 72;

// Passwords and words people pick first, and that guessing tools try first
const COMMON = [
  "password", "passw0rd", "qwerty", "azerty", "letmein", "welcome", "admin", "iloveyou", "monkey", "dragon", "football", "baseball", "basketball",
  "sunshine", "princess", "starwars", "superman", "batman", "trustno1", "master", "shadow", "michael", "jordan", "mustang", "hunter", "secret",
  "abc123", "123456", "1234567890", "111111", "000000", "654321", "qazwsx", "zxcvbn", "asdfgh", "computer", "internet", "whatever", "freedom",
  "ogcw", "onegreatculture", "culture", "changeme", "default", "login", "summer", "winter", "spring", "autumn", "london", "newyork", "lakers",
];
const SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm", "01234567890", "09876543210"];

export type PasswordRule = { id: "length" | "mix" | "personal" | "common"; label: string; met: boolean };
export type PasswordReport = {
  ok: boolean;
  /** 0 to 4: too weak, weak, fair, strong, very strong */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  rules: PasswordRule[];
  /** The first rule not met, in words, for the error message */
  problem: string | null;
};

const LABELS = ["Too weak", "Weak", "Fair", "Strong", "Very strong"] as const;

function hasSequence(lower: string) {
  for (const run of SEQUENCES) {
    for (let i = 0; i + 4 <= run.length; i++) if (lower.includes(run.slice(i, i + 4))) return true;
  }
  return false;
}

export function checkPassword(password: string, about: { email?: string; name?: string } = {}): PasswordReport {
  const lower = password.toLowerCase();
  const plain = lower.replace(/[^a-z0-9]/g, "").replace(/0/g, "o").replace(/1/g, "l").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a");
  const personal = [about.email?.split("@")[0], ...(about.name ?? "").split(/\s+/)].map((part) => part?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "").filter((part) => part.length >= 4);
  // Common: a well-known password with little else added ("Password2026!"), or hardly any different characters
  const common = COMMON.some((word) => plain.includes(word) && plain.replace(word, "").length < 6) || new Set(lower).size < 5;
  const rules: PasswordRule[] = [
    { id: "length", label: `At least ${PASSWORD_MIN} characters`, met: password.length >= PASSWORD_MIN && new TextEncoder().encode(password).length <= PASSWORD_MAX },
    { id: "mix", label: "Letters and numbers", met: /\p{L}/u.test(password) && /\d/.test(password) },
    { id: "personal", label: "Not your name or email", met: !personal.some((part) => lower.includes(part)) },
    { id: "common", label: "Not a common password", met: password.length > 0 && !common },
  ];

  // A rough measure of how long guessing would take: the kinds of characters
  // used, the length, and how predictable it is
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  let bits = password.length * Math.log2(Math.max(pool, 1));
  if (hasSequence(lower)) bits -= 15;
  if (/(.)\1{2,}/.test(password)) bits -= 10;
  if (/^[a-z]+\d+$/i.test(password)) bits -= 10; // a word then numbers
  let score = (bits < 45 ? 0 : bits < 60 ? 1 : bits < 75 ? 2 : bits < 95 ? 3 : 4) as PasswordReport["score"];

  const failed = rules.find((rule) => !rule.met);
  if (failed) score = Math.min(score, 1) as PasswordReport["score"];
  if (!password) score = 0;
  const tooLong = new TextEncoder().encode(password).length > PASSWORD_MAX;
  const problem = !failed
    ? score < 2
      ? "That password is easy to guess. Make it longer, or mix in capitals and symbols."
      : null
    : failed.id === "length"
      ? tooLong
        ? `Keep it under ${PASSWORD_MAX} characters.`
        : `Use at least ${PASSWORD_MIN} characters.`
      : failed.id === "mix"
        ? "Use both letters and numbers."
        : failed.id === "personal"
          ? "Don’t use your name or email in your password."
          : "That’s a well-known password. Choose something only you would think of.";
  return { ok: !problem, score, label: LABELS[score], rules, problem };
}
