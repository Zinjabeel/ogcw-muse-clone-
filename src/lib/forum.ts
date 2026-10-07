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

const clean = (text: string) => text.replace(/\s+\n/g, "\n").trim();

export async function startThread(user: User, input: { room: RoomId; title: string; body: string }): Promise<string> {
  const title = clean(input.title);
  const body = clean(input.body);
  if (title.length < 4) throw new Error("Give your thread a title (at least 4 characters).");
  if (title.length > 140) throw new Error("Keep the title under 140 characters.");
  if (!body) throw new Error("Write something to start the conversation.");
  if (body.length > 5000) throw new Error("Keep it under 5,000 characters.");
  const { data, error } = await getSupabase().from("forum_threads").insert({ room: input.room, title, body, author_id: user.id, author_name: user.name.slice(0, 60) }).select("id").single();
  if (error) throw new Error(/ogcw/i.test(user.name) ? "Names with “OGCW” in them are kept for the OGCW team. Change your name in your account first." : "Your thread didn’t post. Try again.");
  return (data as { id: string }).id;
}

export async function reply(user: User, threadId: string, text: string) {
  const body = clean(text);
  if (!body) throw new Error("Write a reply first.");
  if (body.length > 3000) throw new Error("Keep replies under 3,000 characters.");
  const { error } = await getSupabase().from("forum_replies").insert({ thread_id: threadId, body, author_id: user.id, author_name: user.name.slice(0, 60) });
  if (error) throw new Error(/ogcw/i.test(user.name) ? "Names with “OGCW” in them are kept for the OGCW team." : "Your reply didn’t post. Try again.");
}

export async function deleteThread(id: string) {
  const { error } = await getSupabase().from("forum_threads").delete().eq("id", id);
  if (error) throw new Error("That didn’t delete. Try again.");
}

export async function deleteReply(id: string) {
  const { error } = await getSupabase().from("forum_replies").delete().eq("id", id);
  if (error) throw new Error("That didn’t delete. Try again.");
}

/** Upvote a thread, or take the upvote back; returns the new score */
export async function toggleVote(threadId: string): Promise<number> {
  const { data, error } = await getSupabase().rpc("forum_toggle_vote", { p_thread: threadId });
  if (error) throw new Error("Log in to vote.");
  return Number(data);
}

/** The threads this account has upvoted */
export async function myVotes(): Promise<Set<string>> {
  const { data } = await getSupabase().from("forum_votes").select("thread_id");
  return new Set(((data ?? []) as { thread_id: string }[]).map((row) => row.thread_id));
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
