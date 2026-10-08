import { createServerFn } from "@tanstack/react-start";
import { RAP_POLL_CHOICES, type RapPollChoice } from "@/data/content";

// The vote counter for the No. 1 rapper poll on the rap desk. Everyone's
// votes land in the same count on the server, so the percentages are what
// people actually picked (each browser votes once; see rap-desk.tsx).
// TODO: keep the counts in a database. In server memory they start again
// from zero whenever the server restarts, and each server copy keeps its own.

export type RapPollCounts = Record<RapPollChoice, number>;

const counts = new Map<RapPollChoice, number>(RAP_POLL_CHOICES.map((choice) => [choice, 0]));
const snapshot = () => Object.fromEntries(RAP_POLL_CHOICES.map((choice) => [choice, counts.get(choice) ?? 0])) as RapPollCounts;
const isChoice = (value: unknown): value is RapPollChoice => RAP_POLL_CHOICES.some((choice) => choice === value);

export const getRapPoll = createServerFn({ method: "GET" }).handler(async () => snapshot());

export const voteRapPoll = createServerFn({ method: "POST" })
  .inputValidator((choice: unknown) => {
    if (!isChoice(choice)) throw new Error("Not one of the names on the ballot");
    return choice;
  })
  .handler(async ({ data }) => {
    counts.set(data, (counts.get(data) ?? 0) + 1);
    return snapshot();
  });
