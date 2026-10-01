import { useEffect, useState } from "react";
import { SANITY_PROJECT_ID } from "@/sanity/env";

// Reader accounts (sign up, sign in, sign out), used by /login and the
// account button in the header.
// TODO: Supabase. For now accounts are kept in this browser (localStorage):
// the password is never stored, only a salted PBKDF2 hash of it. Swapping in
// Supabase Auth means rewriting the four functions below (signUp, signIn,
// signOut, readUser); the pages that use them stay as they are.
//
// Admins don't use these accounts: they sign in to the studio at /admin with
// GitHub (Sanity's own login; only the Sanity project's members get in).

export type User = { id: string; name: string; email: string };

type StoredAccount = User & { salt: string; hash: string; createdAt: string };
const ACCOUNTS_KEY = "ogcw-accounts";
const SESSION_KEY = "ogcw-session";
const CHANGE_EVENT = "ogcw-auth";

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Your browser is blocking storage, so we can’t keep you signed in. Allow site data and try again.");
  }
};
const announce = () => window.dispatchEvent(new Event(CHANGE_EVENT));

const toHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 210_000 }, key, 256);
  return toHex(bits);
}

const normaliseEmail = (email: string) => email.trim().toLowerCase();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Create an account and sign in. Throws a readable message if something's wrong. */
export async function signUp(input: { name: string; email: string; password: string }): Promise<User> {
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) throw new Error("Add your name.");
  if (name.length > 60) throw new Error("Keep your name under 60 characters.");
  if (!EMAIL.test(email)) throw new Error("That email address doesn’t look right.");
  if (input.password.length < 8) throw new Error("Use at least 8 characters for your password.");
  const accounts = read<StoredAccount[]>(ACCOUNTS_KEY, []);
  if (accounts.some((account) => account.email === email)) throw new Error("There’s already an account with this email. Sign in instead.");
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const account: StoredAccount = { id: crypto.randomUUID(), name, email, salt, hash: await hashPassword(input.password, salt), createdAt: new Date().toISOString() };
  write(ACCOUNTS_KEY, [...accounts, account]);
  const user: User = { id: account.id, name, email };
  write(SESSION_KEY, user);
  announce();
  return user;
}

/** Sign in with email and password. Throws a readable message if it doesn't match. */
export async function signIn(input: { email: string; password: string }): Promise<User> {
  const email = normaliseEmail(input.email);
  const account = read<StoredAccount[]>(ACCOUNTS_KEY, []).find((item) => item.email === email);
  if (!account || (await hashPassword(input.password, account.salt)) !== account.hash) throw new Error("That email and password don’t match.");
  const user: User = { id: account.id, name: account.name, email: account.email };
  write(SESSION_KEY, user);
  announce();
  return user;
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing stored, nothing to remove
  }
  announce();
}

function readUser(): User | null {
  const user = read<User | null>(SESSION_KEY, null);
  return user && typeof user.email === "string" && typeof user.name === "string" ? user : null;
}

/** Whether this browser is signed in to the OGCW studio (/admin) as an admin */
export function hasStudioSession() {
  try {
    return Boolean(localStorage.getItem(`__studio_auth_token_${SANITY_PROJECT_ID}`));
  } catch {
    return false;
  }
}

/** The signed-in reader (null when signed out, and on the server) and whether the studio is signed in */
export function useUser() {
  const [state, setState] = useState<{ user: User | null; admin: boolean; ready: boolean }>({ user: null, admin: false, ready: false });
  useEffect(() => {
    const update = () => setState({ user: readUser(), admin: hasStudioSession(), ready: true });
    update();
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update); // other tabs
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return state;
}
