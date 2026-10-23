// What the page is told about the visitor's account (the server works it
// out from the login cookie: src/lib/server/session.server.ts).

export type AccountUser = { id: string; name: string; email: string };

export type AccountState = {
  user: AccountUser | null;
  /** Two-step login is on and the 6-digit code hasn't been given yet */
  needsCode: boolean;
  /** Two-step login (an authenticator app) is on */
  twoStep: boolean;
  /** Has a password (accounts made with Google may not) */
  hasPassword: boolean;
  /** Admin access, fully unlocked: an admin account, with its two-step code given */
  admin: boolean;
  /** An admin account that still has to turn on, or type, its two-step code */
  adminLocked: boolean;
};

export const SIGNED_OUT: AccountState = { user: null, needsCode: false, twoStep: false, hasPassword: false, admin: false, adminLocked: false };
