import { createClient, type SanityClient } from "@sanity/client";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { setting } from "./settings.server";

// Limits on tries (22 Oct 2026): logins, codes, sign-ups and reset emails
// can only be tried so many times in a while, per visitor (IP address) and
// per account, so nobody can guess their way in. The counts are kept in
// Sanity, in private documents nobody can read without the server's key
// ("private.guard.…"), so they survive a server restart and are shared by
// every server; if Sanity can't be reached, the server counts in memory.

export type Limit = { bucket: string; max: number; minutes: number };

export const LIMITS = {
  loginIp: { bucket: "login-ip", max: 30, minutes: 15 },
  loginAccount: { bucket: "login-account", max: 6, minutes: 15 },
  code: { bucket: "code", max: 6, minutes: 15 },
  signupIp: { bucket: "signup-ip", max: 6, minutes: 60 },
  resetIp: { bucket: "reset-ip", max: 6, minutes: 60 },
  resetAccount: { bucket: "reset-account", max: 3, minutes: 60 },
  phoneIp: { bucket: "phone-ip", max: 5, minutes: 60 },
  passwordCheck: { bucket: "password-check", max: 6, minutes: 15 },
} satisfies Record<string, Limit>;

export const TOO_MANY = "Too many tries. For your safety, wait 15 minutes and try again.";

const memory = new Map<string, number>();

// Made again whenever the server's Sanity key changes
let client: { token: string; sanity: SanityClient } | null = null;
async function store() {
  const token = await setting("SANITY_EDITOR_TOKEN");
  if (!token) return null;
  if (client?.token !== token) client = { token, sanity: createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, token, useCdn: false }) };
  return client.sanity;
}

async function idFor(limit: Limit, key: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${limit.bucket}:${key.toLowerCase()}`));
  const hash = Array.from(new Uint8Array(bytes).slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const window = Math.floor(Date.now() / (limit.minutes * 60_000));
  return `private.guard.${limit.bucket}.${hash}.${window}`;
}

/** How many tries are counted against this key right now */
export async function tries(limit: Limit, key: string): Promise<number> {
  const id = await idFor(limit, key);
  const known = memory.get(id) ?? 0;
  if (known >= limit.max) return known;
  const sanity = await store();
  if (!sanity) return known;
  try {
    const count = await sanity.fetch<number | null>(`*[_id == $id][0].count`, { id });
    return Math.max(known, count ?? 0);
  } catch {
    return known;
  }
}

/** Count one more try; returns whether it is still within the limit */
export async function count(limit: Limit, key: string): Promise<boolean> {
  const id = await idFor(limit, key);
  let total = (memory.get(id) ?? 0) + 1;
  const sanity = await store();
  if (sanity && total <= limit.max + 1) {
    try {
      const expires = new Date(Date.now() + 2 * limit.minutes * 60_000).toISOString();
      const result = await sanity
        .transaction()
        .createIfNotExists({ _id: id, _type: "authGuard", bucket: limit.bucket, count: 0, expires })
        .patch(id, (patch) => patch.inc({ count: 1 }))
        .commit({ returnDocuments: true, visibility: "sync" });
      const doc = (result as unknown as { _id: string; count?: number }[]).find((item) => item._id === id);
      if (typeof doc?.count === "number") total = Math.max(total, doc.count);
      // Now and then, old counts are cleared away
      if (Math.random() < 0.03) void sanity.delete({ query: `*[_type == "authGuard" && expires < now()][0...200]` }).catch(() => {});
    } catch {
      // counted in memory only
    }
  }
  memory.set(id, total);
  if (memory.size > 5000) memory.clear();
  return total <= limit.max;
}

/** Already over the limit? (checked before trying, so a locked account isn't even tried) */
export async function blocked(limit: Limit, key: string) {
  return (await tries(limit, key)) >= limit.max;
}

/** After a right password or code, the account's wrong tries are forgotten */
export async function forgive(limit: Limit, key: string) {
  const id = await idFor(limit, key);
  memory.delete(id);
  const sanity = await store();
  await sanity?.delete(id).catch(() => {});
}
