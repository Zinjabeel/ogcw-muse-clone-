import { accountState, openSession, supabaseClient } from "./session.server";

// Votes, ratings and story answers, sent through the server (22 Oct 2026).
// For a logged-in reader they go as that account (one vote per account, as
// the database counts them); for everyone else, as the browser's random
// voter id, with the visitor's IP address passed on for Supabase's limits.
// Only these database functions can be called this way.

// The list of functions is checked in src/lib/votes-api.ts before this runs
export type VoteFunction = "rate_story" | "vote_poll" | "vote_ranking" | "story_feedback_answer" | "story_feedback_note";

/** The database's answer comes back as JSON (the new totals, for some) */
export async function cast(input: { fn: VoteFunction; args: Record<string, string | number | null> }): Promise<{ ok: boolean; json: string }> {
  const open = await openSession().catch(() => null);
  const asAccount = open && !(await accountState(open.session)).needsCode;
  const client = asAccount ? open.client : supabaseClient();
  const { data, error } = await client.rpc(input.fn, input.args);
  return { ok: !error, json: JSON.stringify(data ?? null) };
}
