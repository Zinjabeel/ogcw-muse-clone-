import { accountState, openSession } from "./session.server";

// The forum's writing side, run on the server as the logged-in reader
// (22 Oct 2026). The database's own row-level security still decides: a
// thread or reply can only be posted as yourself and deleted by whoever
// wrote it. Reading the forum stays in the browser (it's public).

type Answer<T extends object = object> = ({ ok: true } & T) | { ok: false; message: string };
const fail = (message: string) => ({ ok: false as const, message });
const clean = (text: string) => text.replace(/\s+\n/g, "\n").trim();

async function reader() {
  const open = await openSession();
  if (!open) return null;
  const account = await accountState(open.session);
  if (!account.user || account.needsCode) return null;
  return { client: open.client, user: account.user };
}

export async function startThread(input: { room: string; title: string; body: string }): Promise<Answer<{ id: string }>> {
  const me = await reader();
  if (!me) return fail("Log in to start a thread.");
  const title = clean(input.title);
  const body = clean(input.body);
  if (title.length < 4) return fail("Give your thread a title (at least 4 characters).");
  if (title.length > 140) return fail("Keep the title under 140 characters.");
  if (!body) return fail("Write something to start the conversation.");
  if (body.length > 5000) return fail("Keep it under 5,000 characters.");
  const { data, error } = await me.client.from("forum_threads").insert({ room: input.room, title, body, author_id: me.user.id, author_name: me.user.name }).select("id").single();
  if (error) return fail(/ogcw/i.test(me.user.name) ? "Names with “OGCW” in them are kept for the OGCW team. Change your name in your account first." : "Your thread didn’t post. Try again.");
  return { ok: true, id: (data as { id: string }).id };
}

export async function reply(input: { threadId: string; body: string }): Promise<Answer> {
  const me = await reader();
  if (!me) return fail("Log in to reply.");
  const body = clean(input.body);
  if (!body) return fail("Write a reply first.");
  if (body.length > 3000) return fail("Keep replies under 3,000 characters.");
  const { error } = await me.client.from("forum_replies").insert({ thread_id: input.threadId, body, author_id: me.user.id, author_name: me.user.name });
  if (error) return fail(/ogcw/i.test(me.user.name) ? "Names with “OGCW” in them are kept for the OGCW team." : "Your reply didn’t post. Try again.");
  return { ok: true };
}

export async function remove(input: { kind: "thread" | "reply"; id: string }): Promise<Answer> {
  const me = await reader();
  if (!me) return fail("Log in first.");
  const table = input.kind === "thread" ? "forum_threads" : "forum_replies";
  // Only your own: the author is checked here as well as by the database
  const { error } = await me.client.from(table).delete().eq("id", input.id).eq("author_id", me.user.id);
  return error ? fail("That didn’t delete. Try again.") : { ok: true };
}

export async function toggleVote(input: { threadId: string }): Promise<Answer<{ score: number }>> {
  const me = await reader();
  if (!me) return fail("Log in to vote.");
  const { data, error } = await me.client.rpc("forum_toggle_vote", { p_thread: input.threadId });
  return error ? fail("That vote didn’t count. Try again.") : { ok: true, score: Number(data) };
}

export async function myVotes(): Promise<string[]> {
  const me = await reader();
  if (!me) return [];
  // The database only shows each reader their own votes
  const { data } = await me.client.from("forum_votes").select("thread_id");
  return ((data ?? []) as { thread_id: string }[]).map((row) => row.thread_id);
}
