import { RAP_POLL_CHOICES, type RapPollChoice } from "@/data/content";
import { pollTotals, votePoll } from "./polls";

// The vote counter for the No. 1 rapper poll on the rap desk. The votes are
// kept in Supabase with the site's other reader polls (poll_votes, through
// vote_poll / poll_totals), so they survive restarts and every visitor sees
// the same count. One vote per account, or else per browser; the database
// checks that, not just the page (rap-vote.tsx also remembers it locally).

export type RapPollCounts = Record<RapPollChoice, number>;

const POLL = "no1-rapper";
const isChoice = (value: unknown): value is RapPollChoice => RAP_POLL_CHOICES.some((choice) => choice === value);
const snapshot = (totals: Record<string, number>) => Object.fromEntries(RAP_POLL_CHOICES.map((choice) => [choice, totals[choice] ?? 0])) as RapPollCounts;

export async function getRapPoll(): Promise<RapPollCounts> {
  return snapshot(await pollTotals(POLL));
}

export async function voteRapPoll({ data: choice }: { data: unknown }): Promise<RapPollCounts> {
  if (!isChoice(choice)) throw new Error("Not one of the names on the ballot");
  await votePoll(POLL, choice);
  return getRapPoll();
}
