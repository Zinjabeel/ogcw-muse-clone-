import { getSupabase } from "./supabase";
import { voterId } from "./polls";

// Reader answers to the yes/no question at the end of each story ("Was this
// helpful?", "Are you going?"), and the notes people add under it. Both are
// kept in Supabase (story_feedback, story_feedback_notes), so the share a
// reader sees is everyone's and nothing is lost on a restart. One answer per
// account, or else per browser, checked by the database. Notes are kept for
// the desk to read (in Supabase) and never shown on the site; a reader can
// leave five a day on a story.

export type Answer = "yes" | "no";
export type FeedbackCounts = Record<Answer, number>;

const storySlug = (value: unknown) => {
  // Any story address (stories can be added in the studio at any time)
  if (typeof value !== "string" || !/^[a-z0-9-]{1,120}$/.test(value)) throw new Error("Not a story address");
  return value;
};
const isAnswer = (value: unknown): value is Answer => value === "yes" || value === "no";
const toCounts = (rows: unknown): FeedbackCounts => {
  const row = (Array.isArray(rows) ? rows[0] : rows) as { yes?: number | string; no?: number | string } | undefined;
  return { yes: Number(row?.yes ?? 0), no: Number(row?.no ?? 0) };
};

export async function getFeedback({ data }: { data: unknown }): Promise<FeedbackCounts> {
  const { data: rows, error } = await getSupabase().rpc("story_feedback_totals", { p_slug: storySlug(data) });
  if (error) throw new Error("The answers couldn’t be loaded.");
  return toCounts(rows);
}

export async function sendFeedback({ data }: { data: { slug: unknown; answer: unknown } }): Promise<FeedbackCounts> {
  if (!isAnswer(data.answer)) throw new Error("The answer is yes or no");
  const { data: rows, error } = await getSupabase().rpc("story_feedback_answer", { p_slug: storySlug(data.slug), p_answer: data.answer, p_voter: voterId() });
  if (error) throw new Error("That didn’t go through.");
  return toCounts(rows);
}

export async function sendFeedbackNote({ data }: { data: { slug: unknown; answer: unknown; text: unknown } }) {
  if (typeof data.text !== "string" || !data.text.trim()) throw new Error("The note is empty");
  const { error } = await getSupabase().rpc("story_feedback_note", {
    p_slug: storySlug(data.slug),
    p_answer: isAnswer(data.answer) ? data.answer : null,
    p_text: data.text.trim().slice(0, 1000),
    p_voter: voterId(),
  });
  if (error) throw new Error("That didn’t go through.");
  return { ok: true };
}
