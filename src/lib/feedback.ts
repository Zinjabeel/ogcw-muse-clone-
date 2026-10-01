import { createServerFn } from "@tanstack/react-start";

// Reader answers to the yes/no question at the end of each story ("Was this
// helpful?", "Are you going?"), and the notes people add under it. Answers
// are counted on the server, so the share a reader sees is everyone's. Notes
// are kept for the desk to read and never shown on the site.
// TODO: keep both in a database. In server memory they start again from
// zero whenever the server restarts, and each server copy keeps its own.

export type Answer = "yes" | "no";
export type FeedbackCounts = Record<Answer, number>;

const counts = new Map<string, FeedbackCounts>();
const notes: { slug: string; answer: Answer | null; text: string; at: string }[] = [];

const countsFor = (slug: string): FeedbackCounts => counts.get(slug) ?? { yes: 0, no: 0 };
const storySlug = (value: unknown) => {
  // Any story address (stories can be added in the studio at any time)
  if (typeof value !== "string" || !/^[a-z0-9-]{1,120}$/.test(value)) throw new Error("Not a story address");
  return value;
};
const isAnswer = (value: unknown): value is Answer => value === "yes" || value === "no";

export const getFeedback = createServerFn({ method: "GET" })
  .inputValidator((slug: unknown) => storySlug(slug))
  .handler(async ({ data }) => countsFor(data));

export const sendFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const { slug, answer } = (input ?? {}) as { slug?: unknown; answer?: unknown };
    if (!isAnswer(answer)) throw new Error("The answer is yes or no");
    return { slug: storySlug(slug), answer };
  })
  .handler(async ({ data }) => {
    const next = { ...countsFor(data.slug) };
    next[data.answer] += 1;
    counts.set(data.slug, next);
    return next;
  });

export const sendFeedbackNote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const { slug, answer, text } = (input ?? {}) as { slug?: unknown; answer?: unknown; text?: unknown };
    if (typeof text !== "string" || !text.trim()) throw new Error("The note is empty");
    return { slug: storySlug(slug), answer: isAnswer(answer) ? answer : null, text: text.trim().slice(0, 1000) };
  })
  .handler(async ({ data }) => {
    notes.push({ ...data, at: new Date().toISOString() });
    if (notes.length > 1000) notes.shift();
    return { ok: true };
  });
