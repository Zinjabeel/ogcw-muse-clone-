import { getSupabase } from "./supabase";

// The OGCW 10 vote: readers pick the story they'd put at No. 1. One vote per
// account, or else per browser (the same random id the star ratings use),
// per weekly round; voting again moves the vote. Counts are kept in Supabase
// (vote_ranking / ranking_totals) and shown as they are.

const VOTER_KEY = "ogcw-voter";
const MINE_KEY = "ogcw-ranking-vote";

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
function voterId() {
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

/** This week's round, "2026-W41" (ISO weeks, Monday to Sunday) */
export function currentRound(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function rankingTotals(round: string): Promise<Record<string, number>> {
  const { data, error } = await getSupabase().rpc("ranking_totals", { p_round: round });
  if (error) throw new Error("The votes couldn’t be loaded.");
  return Object.fromEntries(((data ?? []) as { slug: string; votes: number }[]).map((row) => [row.slug, Number(row.votes)]));
}

export async function voteRanking(round: string, slug: string) {
  const { error } = await getSupabase().rpc("vote_ranking", { p_round: round, p_slug: slug, p_voter: voterId() });
  if (error) throw new Error("Your vote didn’t go through. Try again.");
  try { localStorage.setItem(MINE_KEY, JSON.stringify({ round, slug })); } catch { /* the vote still counts */ }
}

/** The story this browser voted for in this round, if any */
export function myRankingVote(round: string): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(MINE_KEY) ?? "null") as { round?: string; slug?: string } | null;
    return saved?.round === round && saved.slug ? saved.slug : null;
  } catch {
    return null;
  }
}
