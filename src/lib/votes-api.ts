import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Casting a vote, a rating or a story answer (src/lib/server/votes.server.ts):
// as the logged-in account when there is one, otherwise as this browser.

type VoteFunction = "rate_story" | "vote_poll" | "vote_ranking" | "story_feedback_answer" | "story_feedback_note";

const castFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      fn: z.enum(["rate_story", "vote_poll", "vote_ranking", "story_feedback_answer", "story_feedback_note"]),
      args: z.record(z.union([z.string().max(2000), z.number(), z.null()])).refine((args) => Object.keys(args).length <= 6),
    }).parse(data),
  )
  .handler(async ({ data }) => (await import("./server/votes.server")).cast(data));

/** Call one of the voting functions; returns the database's answer, or throws `message` if it didn't count */
export async function castVote(fn: VoteFunction, args: Record<string, string | number | null>, message: string): Promise<unknown> {
  const answer = await castFn({ data: { fn, args } }).catch(() => null);
  if (!answer?.ok) throw new Error(message);
  return JSON.parse(answer.json) as unknown;
}
