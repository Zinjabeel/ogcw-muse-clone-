import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabase } from "./supabase";
import type { User } from "./auth";

// The OGCW Forum: rooms of threads, replies and upvotes, kept in Supabase
// (forum_threads, forum_replies, forum_votes; row-level security lets
// everyone read and only signed-in readers post, as themselves). Readers can
// delete what they wrote. Threads marked official are OGCW's own prompts.

export const ROOMS = [
  { id: "ogcw-10", name: "The OGCW 10", blurb: "Argue the ranking: what should move up, what we missed." },
  { id: "rap", name: "Rap & R&B", blurb: "Albums, charts, beefs and the No. 1 debate." },
  { id: "sneakers", name: "Sneakers", blurb: "Release days, Ls, Ws and what’s worth the queue." },
  { id: "games", name: "Games", blurb: "GTA VI, Switch 2 and everything on the calendar." },
  { id: "sports", name: "Sports", blurb: "The NBA season, the Ballon d’Or and athletes off the pitch." },
  { id: "fashion", name: "Fashion", blurb: "Runways, fits and the shows that stay with you." },
  { id: "streaming", name: "Streaming", blurb: "Streamers, records and the Streamer Awards." },
] as const;
export type RoomId = (typeof ROOMS)[number]["id"];
export const getRoom = (id: string) => ROOMS.find((room) => room.id === id);

export type Thread = { id: string; room: RoomId; title: string; body: string; author_id: string | null; author_name: string; official: boolean; reply_count: number; score: number; created_at: string; last_activity_at: string };
export type Reply = { id: string; thread_id: string; body: string; author_id: string | null; author_name: string; created_at: string };

const THREAD_COLUMNS = "id, room, title, body, author_id, author_name, official, reply_count, score, created_at, last_activity_at";

export async function listThreads(options: { room?: RoomId; sort?: "new" | "top"; limit?: number } = {}): Promise<Thread[]> {
  let query = getSupabase().from("forum_threads").select(THREAD_COLUMNS);
  if (options.room) query = query.eq("room", options.room);
  query = options.sort === "top" ? query.order("score", { ascending: false }).order("last_activity_at", { ascending: false }) : query.order("last_activity_at", { ascending: false });
  const { data, error } = await query.limit(options.limit ?? 50);
  if (error) throw new Error("The forum couldn’t be loaded. Try again.");
  return (data ?? []) as Thread[];
}

export async function getThread(id: string): Promise<{ thread: Thread; replies: Reply[] } | null> {
  const supabase = getSupabase();
  const [{ data: thread, error }, { data: replies }] = await Promise.all([
    supabase.from("forum_threads").select(THREAD_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("forum_replies").select("id, thread_id, body, author_id, author_name, created_at").eq("thread_id", id).order("created_at"),
  ]);
  if (error) throw new Error("This thread couldn’t be loaded. Try again.");
  return thread ? { thread: thread as Thread, replies: (replies ?? []) as Reply[] } : null;
}

// Posting, deleting and voting happen on the server, as the logged-in reader
// (src/lib/server/forum.server.ts): the login never leaves the server
const forumServer = () => import("./server/forum.server");
const id = z.string().min(1).max(64);
const parse = <T extends z.ZodTypeAny>(schema: T) => (data: unknown): z.infer<T> => schema.parse(data);
const startThreadFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ room: z.enum(ROOMS.map((room) => room.id) as [RoomId, ...RoomId[]]), title: z.string().max(400), body: z.string().max(12000) })))
  .handler(async ({ data }) => (await forumServer()).startThread(data));
const replyFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ threadId: id, body: z.string().max(8000) })))
  .handler(async ({ data }) => (await forumServer()).reply(data));
const removeFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ kind: z.enum(["thread", "reply"]), id })))
  .handler(async ({ data }) => (await forumServer()).remove(data));
const voteFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ threadId: id })))
  .handler(async ({ data }) => (await forumServer()).toggleVote(data));
const myVotesFn = createServerFn({ method: "POST" }).handler(async () => (await forumServer()).myVotes());

type Answer = { ok: true } | { ok: false; message: string };
function unwrap<T extends Answer>(answer: T): Extract<T, { ok: true }> {
  if (!answer.ok) throw new Error(answer.message);
  return answer as Extract<T, { ok: true }>;
}

// `user` is who the page thinks is logged in; the server checks for itself
export async function startThread(_user: User, input: { room: RoomId; title: string; body: string }): Promise<string> {
  return unwrap(await startThreadFn({ data: input })).id;
}

export async function reply(_user: User, threadId: string, text: string) {
  unwrap(await replyFn({ data: { threadId, body: text } }));
}

export async function deleteThread(threadId: string) {
  unwrap(await removeFn({ data: { kind: "thread", id: threadId } }));
}

export async function deleteReply(replyId: string) {
  unwrap(await removeFn({ data: { kind: "reply", id: replyId } }));
}

/** Upvote a thread, or take the upvote back; returns the new score */
export async function toggleVote(threadId: string): Promise<number> {
  return unwrap(await voteFn({ data: { threadId } })).score;
}

/** The threads this account has upvoted */
export async function myVotes(): Promise<Set<string>> {
  return new Set(await myVotesFn().catch(() => []));
}

/** "5 min ago", "3 h ago", "2 days ago", then the date */
export function ago(iso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}
