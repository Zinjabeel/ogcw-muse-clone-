import { storePreference } from "./consent";
import { getSupabase } from "./supabase";
import { castVote } from "./votes-api";

// Reader polls (the first: favourite brand of the year, under Culture &
// fashion). One vote per account, or else per browser (the same random id the
// star ratings and the OGCW 10 vote use), per poll; voting again moves the
// vote. Counts are kept in Supabase (vote_poll / poll_totals) and shown as
// they are.

const VOTER_KEY = "ogcw-voter";
const mineKey = (poll: string) => `ogcw-poll-${poll}`;

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
/** This browser's random voter id (also used by the story questions) */
export function voterId() {
  try {
    let id = localStorage.getItem(VOTER_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VOTER_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

export async function pollTotals(poll: string): Promise<Record<string, number>> {
  const { data, error } = await getSupabase().rpc("poll_totals", { p_poll: poll });
  if (error) throw new Error("The votes couldn’t be loaded.");
  return Object.fromEntries(((data ?? []) as { choice: string; votes: number }[]).map((row) => [row.choice, Number(row.votes)]));
}

export async function votePoll(poll: string, choice: string) {
  // Through the server: as the logged-in account, if there is one (src/lib/votes-api.ts)
  await castVote("vote_poll", { p_poll: poll, p_choice: choice, p_voter: voterId() }, "Your vote didn’t go through. Try again.");
  storePreference(mineKey(poll), choice); // remembered only if the reader allows preferences
}

/** The choice this browser voted for, if any */
export function myPollVote(poll: string): string | null {
  try { return localStorage.getItem(mineKey(poll)); } catch { return null; }
}
