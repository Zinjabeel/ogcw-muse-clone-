import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowBigUp, BadgeCheck, MessageSquare, PenLine } from "lucide-react";
import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useUser } from "@/lib/auth";
import { ROOMS, ago, listThreads, myVotes, startThread, toggleVote, type RoomId, type Thread } from "@/lib/forum";
import { SiteShell } from "./ogcw-layout";
import { EditSection, T } from "./site-text";

// Shared pieces of the OGCW Forum (src/routes/forum.*): the black forum
// head with the rooms, a thread row, the upvote and the new-thread form.

export function ForumShell({ room, children }: { room?: RoomId; children: ReactNode }) {
  return (
    <SiteShell>
      <EditSection name="Blog">
        <div className="fm" data-band="light">
          <header className="fm-head" data-band="dark">
            <div className="fm-wrap">
              <Link to="/forum" className="fm-wordmark">OGCW <span>Forum</span></Link>
              <nav className="fm-rooms" aria-label="Rooms">
                <ul>
                  <li><Link to="/forum" className="fm-room" data-on={!room || undefined}><T k="forum.rooms.all">All rooms</T></Link></li>
                  {ROOMS.map((item) => (
                    <li key={item.id}><Link to="/forum/$room" params={{ room: item.id }} className="fm-room" data-on={room === item.id || undefined}>{item.name}</Link></li>
                  ))}
                </ul>
              </nav>
            </div>
          </header>
          <main className="fm-wrap fm-main">{children}</main>
        </div>
      </EditSection>
    </SiteShell>
  );
}

export function VoteButton({ thread, voted, onChange }: { thread: Thread; voted: boolean; onChange: (score: number, voted: boolean) => void }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const click = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) { navigate({ to: "/login" }); return; }
    setBusy(true);
    try { onChange(await toggleVote(thread.id), !voted); } catch { /* stays as it was */ }
    setBusy(false);
  };
  return (
    <button type="button" className="fm-vote" aria-pressed={voted} disabled={busy} onClick={click} aria-label={`${voted ? "Remove your upvote" : "Upvote"}: ${thread.score} ${thread.score === 1 ? "vote" : "votes"}`} title={user ? undefined : "Log in to vote"}>
      <ArrowBigUp size={22} strokeWidth={1.75} fill={voted ? "currentColor" : "none"} aria-hidden="true" />
      <span>{thread.score}</span>
    </button>
  );
}

export function ThreadRow({ thread, voted, onVote, showRoom = true }: { thread: Thread; voted: boolean; onVote: (score: number, voted: boolean) => void; showRoom?: boolean }) {
  const room = ROOMS.find((item) => item.id === thread.room);
  return (
    <article className="fm-thread">
      <VoteButton thread={thread} voted={voted} onChange={onVote} />
      <Link to="/forum/t/$id" params={{ id: thread.id }} className="fm-thread-link">
        <span className="fm-thread-meta">
          {showRoom && room && <span className="fm-tag">{room.name}</span>}
          <span className={`fm-author ${thread.official ? "is-official" : ""}`}>{thread.official && <BadgeCheck size={13} aria-hidden="true" />}{thread.author_name}</span>
          <span>· {ago(thread.last_activity_at)}</span>
        </span>
        <span className="fm-thread-title">{thread.title}</span>
        <span className="fm-thread-body">{thread.body.length > 180 ? `${thread.body.slice(0, 180)}…` : thread.body}</span>
      </Link>
      <span className="fm-replies"><MessageSquare size={15} aria-hidden="true" /> {thread.reply_count}</span>
    </article>
  );
}

/** Start a thread (signed-in readers); everyone else is pointed to log in */
export function Composer({ room }: { room?: RoomId }) {
  const { user, ready } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<RoomId>(room ?? "ogcw-10");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!ready) return null;
  if (!user) {
    return (
      <div className="fm-compose fm-compose-cta">
        <p><strong><T k="forum.join.title">Join the conversation.</T></strong> <T k="forum.join.copy">Reading is open to everyone; log in or create a free OGCW account to post, reply and vote.</T></p>
        <div className="fm-compose-actions">
          <Link to="/login" className="fx-btn"><T k="forum.join.login">Log in</T></Link>
          <Link to="/signup" className="fx-btn fx-btn-ghost fm-ghost"><T k="forum.join.signup">Create an account</T></Link>
        </div>
      </div>
    );
  }
  if (!open) {
    return (
      <button type="button" className="fm-compose fm-compose-open" onClick={() => setOpen(true)}>
        <PenLine size={18} aria-hidden="true" /> <span><T k="forum.new">Start a thread</T></span> <span className="fm-compose-as">as {user.name}</span>
      </button>
    );
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const id = await startThread(user, { room: pick, title, body });
      navigate({ to: "/forum/t/$id", params: { id } });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <form className="fm-compose fm-form" onSubmit={submit}>
      <p className="fm-form-head"><T k="forum.new">Start a thread</T> <span className="fm-compose-as">as {user.name}</span></p>
      <label className="fm-field">
        <span><T k="forum.form.room">Room</T></span>
        <select value={pick} onChange={(event) => setPick(event.target.value as RoomId)}>
          {ROOMS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="fm-field">
        <span><T k="forum.form.title">Title</T></span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required placeholder="Ask, argue, rank" />
      </label>
      <label className="fm-field">
        <span><T k="forum.form.body">What’s on your mind?</T></span>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} rows={5} required />
      </label>
      {error && <p className="fm-error" role="alert">{error}</p>}
      <div className="fm-compose-actions">
        <button type="submit" className="fx-btn" disabled={busy}>{busy ? "Posting…" : "Post thread"}</button>
        <button type="button" className="fx-btn fx-btn-ghost fm-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="fm-rules"><T k="forum.rules">Keep it about culture, keep it civil. No personal attacks, no spam, no one else’s private details.</T></p>
    </form>
  );
}

// The threads of a room (or all rooms), sorted by latest activity or votes
export function useThreads(room?: Thread["room"]) {
  const { user } = useUser();
  const [sort, setSort] = useState<"new" | "top">("new");
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setThreads(null);
    listThreads({ ...(room ? { room } : {}), sort }).then(setThreads).catch((err: Error) => setError(err.message));
  }, [room, sort]);
  useEffect(() => { if (user) myVotes().then(setVoted).catch(() => {}); else setVoted(new Set()); }, [user]);
  const onVote = (id: string) => (score: number, on: boolean) => {
    setThreads((all) => all?.map((thread) => (thread.id === id ? { ...thread, score } : thread)) ?? null);
    setVoted((set) => { const next = new Set(set); if (on) next.add(id); else next.delete(id); return next; });
  };
  return { threads, voted, onVote, sort, setSort, error };
}

export function ThreadList({ room }: { room?: Thread["room"] }) {
  const { threads, voted, onVote, sort, setSort, error } = useThreads(room);
  return (
    <section className="fm-list" aria-label="Threads">
      <div className="fm-list-head">
        <div className="fm-sort" role="group" aria-label="Sort threads">
          <button type="button" aria-pressed={sort === "new"} onClick={() => setSort("new")}><T k="forum.sort.new">Latest</T></button>
          <button type="button" aria-pressed={sort === "top"} onClick={() => setSort("top")}><T k="forum.sort.top">Top</T></button>
        </div>
        {threads && <p className="fm-count">{threads.length} {threads.length === 1 ? "thread" : "threads"}</p>}
      </div>
      {error && <p className="fm-error">{error}</p>}
      {!threads && !error && <p className="fm-loading">Loading the conversation…</p>}
      {threads?.length === 0 && <p className="fm-loading"><T k="forum.empty">No threads here yet. Start the first one.</T></p>}
      <ol className="fm-threads">
        {threads?.map((thread) => <li key={thread.id}><ThreadRow thread={thread} voted={voted.has(thread.id)} onVote={onVote(thread.id)} showRoom={!room} /></li>)}
      </ol>
    </section>
  );
}

