// Settings that only the server knows (keys and the admin list): from the
// server's environment, or on this computer from .env.local / .env. They are
// never in the code and never sent to a browser. scripts/setup-security.mjs
// writes them; on the hosted site they go in the host's secret settings.
//
//   SANITY_EDITOR_TOKEN  the Sanity key the server saves site edits with
//   OGCW_ADMIN_EMAILS    the accounts with admin access, comma separated

// Read again at most once a minute, so a change takes effect without a restart
const cache = new Map<string, { value: string | undefined; at: number }>();

export async function setting(name: string): Promise<string | undefined> {
  const known = cache.get(name);
  if (known && Date.now() - known.at < 60_000) return known.value;
  let value = process.env[name]?.trim() || undefined;
  if (!value) {
    try {
      const { readFile } = await import("node:fs/promises");
      for (const file of [".env.local", ".env"]) {
        const text = await readFile(file, "utf8").catch(() => "");
        const match = text.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`, "m"));
        if (match?.[1]) {
          value = match[1].trim().replace(/^["']|["']$/g, "");
          break;
        }
      }
    } catch {
      // no files here (a hosted server): only its own settings count
    }
  }
  cache.set(name, { value, at: Date.now() });
  return value;
}

/** The admin accounts' email addresses, lower case */
export async function adminEmails(): Promise<string[]> {
  const raw = (await setting("OGCW_ADMIN_EMAILS")) ?? "";
  return raw.split(/[,;\s]+/).map((email) => email.trim().toLowerCase()).filter(Boolean);
}
