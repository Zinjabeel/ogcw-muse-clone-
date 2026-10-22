// One-time setup for the new logins (22 Oct 2026). Run it from the project
// folder with the email address(es) of the OGCW admin account(s):
//
//   node scripts/setup-security.mjs you@gmail.com
//
// It writes the server's settings into .env.local (never committed: *.local
// is in .gitignore):
//  - OGCW_ADMIN_EMAILS: the accounts with admin access. They still need
//    two-step login (an authenticator app) before admin unlocks.
//  - SANITY_EDITOR_TOKEN: a NEW Sanity key for the server, made here. The
//    old key that the 6-digit admin password handed to browsers is deleted,
//    so any copy of it stops working.
//  - It removes the old OGCW_ADMIN_PASSWORD (070726), which no longer opens anything.
// Add "--turnstile <site key>" once the Cloudflare Turnstile widget exists,
// to switch the "are you human" check on (see SECURITY-SETUP.md).
//
// You need to be logged in to the Sanity command line, as for imports. For
// the hosted site, put the same settings in the host's secret settings.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const turnstileAt = args.indexOf("--turnstile");
const turnstile = turnstileAt >= 0 ? args[turnstileAt + 1]?.trim() : undefined;
const emails = args
  .filter((arg, index) => !arg.startsWith("--") && !(turnstileAt >= 0 && index === turnstileAt + 1))
  .map((email) => email.trim().toLowerCase())
  .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
if (!emails.length) {
  console.error("Give the admin account's email: node scripts/setup-security.mjs you@gmail.com");
  process.exit(1);
}

const sanity = (...command) =>
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["sanity", ...command], {
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" ") },
  });
const json = (out) => JSON.parse(out.slice(Math.min(...["{", "["].map((c) => (out.indexOf(c) < 0 ? Infinity : out.indexOf(c))))));

// A new key for the server
const label = `ogcw-server-editor-${new Date().toISOString().slice(0, 10)}`;
console.log("Asking Sanity for a new server key (editor role)…");
const made = json(sanity("tokens", "add", label, "--role=editor", "--json", "--yes"));
const token = made.key ?? made.token;
if (!token) {
  console.error("Sanity didn't hand back a key. Nothing was changed.");
  process.exit(1);
}

// The old keys: the one the admin password handed out, and older server keys
let removed = 0;
try {
  const list = json(sanity("tokens", "list", "--json"));
  for (const item of Array.isArray(list) ? list : []) {
    const name = String(item.label ?? item.name ?? "");
    if ((name === "ogcw-admin-password-login" || (name.startsWith("ogcw-server-editor-") && name !== label)) && item.id) {
      sanity("tokens", "delete", String(item.id), "--yes");
      removed += 1;
    }
  }
} catch {
  console.warn("Couldn't delete the old key from here. Delete \"ogcw-admin-password-login\" yourself at sanity.io/manage → your project → API → Tokens.");
}

const FILE = ".env.local";
let text = existsSync(FILE) ? readFileSync(FILE, "utf8") : "";
const set = (name, value) => {
  const line = new RegExp(`^\\s*${name}\\s*=.*$`, "m");
  text = line.test(text) ? text.replace(line, `${name}=${value}`) : `${text}${text && !text.endsWith("\n") ? "\n" : ""}${name}=${value}\n`;
};
set("OGCW_ADMIN_EMAILS", emails.join(","));
set("SANITY_EDITOR_TOKEN", token);
if (turnstile) set("VITE_TURNSTILE_SITE_KEY", turnstile);
text = text.replace(/^\s*OGCW_ADMIN_PASSWORD\s*=.*\n?/m, "");
writeFileSync(FILE, text);

console.log(`Done.
  Admin accounts: ${emails.join(", ")}
  New server key saved${removed ? `, ${removed} old key(s) deleted` : ""}.
  The old admin password is gone.${turnstile ? "\n  The \"are you human\" check is on (restart the site to load it)." : ""}
Next: log in at /work with that account, and set up two-step login when it asks.`);
