// One-time setup for the admin password on the work login (/work): it
// makes the studio key the password unlocks and keeps both in .env.local
// (never committed: *.local is in .gitignore). Run it once from the
// project folder, with the password you want:
//
//   node scripts/setup-password-login.mjs 070726
//
// It asks Sanity for a new "editor" key for the project (you need to be
// logged in to the Sanity command line, as you are for imports). Run it
// again to change the password: the key is kept, only the password changes.
// For a hosted copy of the site, put the same two settings
// (OGCW_ADMIN_PASSWORD and SANITY_EDITOR_TOKEN) in its server settings.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const password = process.argv[2]?.trim();
if (!password) {
  console.error("Give the password: node scripts/setup-password-login.mjs <password>");
  process.exit(1);
}

const FILE = ".env.local";
const text = existsSync(FILE) ? readFileSync(FILE, "utf8") : "";
const read = (name) => text.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, "m"))?.[1]?.trim();

let token = read("SANITY_EDITOR_TOKEN");
if (!token) {
  console.log("Asking Sanity for a studio key (editor role)…");
  const out = execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["sanity", "tokens", "add", "ogcw-admin-password-login", "--role=editor", "--json", "--yes"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" ") },
  });
  const json = JSON.parse(out.slice(out.indexOf("{")));
  token = json.key ?? json.token;
  if (!token) {
    console.error("Sanity didn't hand back a key. Nothing was changed.");
    process.exit(1);
  }
}

const set = (body, name, value) => (new RegExp(`^\\s*${name}\\s*=.*$`, "m").test(body) ? body.replace(new RegExp(`^\\s*${name}\\s*=.*$`, "m"), `${name}=${value}`) : `${body}${body && !body.endsWith("\n") ? "\n" : ""}${name}=${value}\n`);
writeFileSync(FILE, set(set(text, "OGCW_ADMIN_PASSWORD", password), "SANITY_EDITOR_TOKEN", token));
console.log(`Done. The admin password is set in ${FILE}. Log in at /work with it (no restart needed).`);
