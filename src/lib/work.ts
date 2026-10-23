import { useEffect, useState } from "react";
import { SANITY_PROJECT_ID } from "@/sanity/env";
import { studioToken } from "./admin-sanity";
import { ACCOUNT_EVENT, currentAccount, refreshAccount, useAccount } from "./auth";

// Who may open the admin dashboard (/admin, the Sanity studio) and edit the
// site on the page (22 Oct 2026). Two ways in, both checked by a server:
//  - an OGCW admin account (its email is on the server's admin list,
//    OGCW_ADMIN_EMAILS) that has given its two-step login code: the server
//    says so (src/lib/server/session.server.ts), and saves its edits itself;
//  - a member of the OGCW Sanity project logged in to the studio with GitHub
//    on this browser: Sanity says so, and checks every change itself.
// The old 6-digit admin password, which handed the browser a Sanity key that
// never ran out, is gone.

export type WorkAccess = "admin" | "member" | "guest";

const STUDIO_TOKEN_KEY = `__studio_auth_token_${SANITY_PROJECT_ID}`;

// Sanity's answer, kept for as long as the same studio login lasts
const members = new Map<string, Promise<boolean>>();

/** Whether this browser is logged in to the OGCW Sanity project as one of its members */
async function sanityMember(): Promise<boolean> {
  const token = studioToken();
  if (!token) return false;
  if (!members.has(token)) {
    members.set(
      token,
      (async () => {
        // Only the project's members are shown its details
        const response = await fetch(`https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}`, { headers: { Authorization: `Bearer ${token}` } });
        return response.ok;
      })().catch(() => {
        members.delete(token);
        return false;
      }),
    );
  }
  return members.get(token)!;
}

/** Admin: an admin account with its code given, or a studio member on this browser */
export async function adminAccess(): Promise<boolean> {
  if (!currentAccount().ready) await refreshAccount(false);
  return currentAccount().admin || sanityMember();
}

/** Log out of the studio on this browser (GitHub) */
export function studioLogout() {
  try {
    localStorage.removeItem(STUDIO_TOKEN_KEY);
  } catch {
    // nothing kept, nothing to remove
  }
  members.clear();
  window.dispatchEvent(new Event(ACCOUNT_EVENT));
}

/**
 * Log in to the studio with GitHub, through Sanity itself (the same login
 * the studio's own login screen uses). Sanity sends the browser back to
 * `returnTo` with a one-time "#sid=…" in the address, which
 * finishStudioLogin swaps for the studio's login.
 */
export function studioLogin(returnTo: string) {
  const params = new URLSearchParams({ origin: `${window.location.origin}${returnTo}`, projectId: SANITY_PROJECT_ID, type: "dual" });
  window.location.assign(`https://api.sanity.io/v1/auth/login/github?${params}`);
}

/** Back from the GitHub login: keep the studio's login, as the studio itself would */
let finishing: Promise<void> | null = null;
export function finishStudioLogin() {
  finishing ??= (async () => {
    const match = window.location.hash.match(/sid=([^&]{20,})/);
    if (!match) return;
    const url = new URL(window.location.href);
    url.hash = window.location.hash.replace(/&?sid=[^&]+/, "").replace(/^#&?$/, "");
    history.replaceState(history.state, "", url);
    const response = await fetch(`https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-06-07/auth/fetch?sid=${encodeURIComponent(match[1]!)}`);
    if (!response.ok) throw new Error("The GitHub login didn’t go through. Try again.");
    const { token } = (await response.json()) as { token?: string };
    if (!token) throw new Error("The GitHub login didn’t go through. Try again.");
    localStorage.setItem(STUDIO_TOKEN_KEY, JSON.stringify({ token }));
    window.dispatchEvent(new Event(ACCOUNT_EVENT));
  })();
  return finishing;
}

/** What the person on this page may do: re-checked whenever they log in or out */
export function useWorkAccess(): WorkAccess | "checking" {
  const account = useAccount();
  const [member, setMember] = useState<boolean | null>(null);
  useEffect(() => {
    let current = true;
    const check = async () => {
      await finishStudioLogin().catch(() => {});
      const result = await sanityMember();
      if (current) setMember(result);
    };
    void check();
    const recheck = () => void check();
    const onStorage = (event: StorageEvent) => { if (event.key === STUDIO_TOKEN_KEY) recheck(); };
    window.addEventListener(ACCOUNT_EVENT, recheck);
    window.addEventListener("storage", onStorage);
    return () => {
      current = false;
      window.removeEventListener(ACCOUNT_EVENT, recheck);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  if (account.admin || member) return "admin";
  if (!account.ready || member === null) return "checking";
  return account.user && !account.needsCode ? "member" : "guest";
}
