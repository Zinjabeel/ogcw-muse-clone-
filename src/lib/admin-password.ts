import { createServerFn } from "@tanstack/react-start";

// The admin password: typed on the work login page (/work) beside "Continue
// with GitHub", it opens the studio straight away, with no GitHub round trip.
// The server checks it; the password and the studio key it hands back are
// settings on the server (OGCW_ADMIN_PASSWORD and SANITY_EDITOR_TOKEN, in
// .env.local on this computer, see scripts/setup-password-login.mjs), never
// in the code. The browser keeps the key the way the studio keeps a GitHub
// login, so it stays logged in until "Log out" is pressed.

export type PasswordLogin = { ok: true; token: string } | { ok: false; message: string };

// Wrong guesses slow down: after five in ten minutes, wait (a short number
// is easy to guess otherwise)
const tries = { wrong: 0, since: 0 };
const WINDOW_MS = 10 * 60_000;
const MAX_WRONG = 5;

export const passwordAdminLogin = createServerFn({ method: "POST" })
  .validator((password: unknown) => {
    if (typeof password !== "string" || !password.length || password.length > 200) throw new Error("Type the password");
    return password;
  })
  .handler(async ({ data }): Promise<PasswordLogin> => {
    // A setting, from the server's environment or from .env.local / .env
    const setting = async (name: string) => {
      const value = process.env[name];
      if (value) return value.trim();
      try {
        const { readFile } = await import("node:fs/promises");
        for (const file of [".env.local", ".env"]) {
          const text = await readFile(file, "utf8").catch(() => "");
          const match = text.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`, "m"));
          if (match?.[1]) return match[1].trim().replace(/^["']|["']$/g, "");
        }
      } catch {
        // no files here (a hosted server): only its own settings count
      }
      return undefined;
    };

    const now = Date.now();
    if (now - tries.since > WINDOW_MS) Object.assign(tries, { wrong: 0, since: now });
    if (tries.wrong >= MAX_WRONG) return { ok: false, message: "Too many wrong tries. Wait ten minutes and try again." };

    const [password, token] = await Promise.all([setting("OGCW_ADMIN_PASSWORD"), setting("SANITY_EDITOR_TOKEN")]);
    if (!password || !token) return { ok: false, message: "The admin password isn’t set up on this server yet." };

    // Compared in full every time, so the answer takes as long right or wrong
    let same = data.length === password.length ? 0 : 1;
    for (let i = 0; i < Math.max(data.length, password.length); i++) same |= (data.charCodeAt(i) || 0) ^ (password.charCodeAt(i) || 0);
    if (same !== 0) {
      tries.wrong += 1;
      await new Promise((resolve) => setTimeout(resolve, 600));
      return { ok: false, message: "That password isn’t right." };
    }
    return { ok: true, token };
  });
