import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowBigUp, ArrowRight, BadgeCheck, Clock, Flame, Footprints, Gamepad2, ListOrdered, MessageSquare, MicVocal, PenLine, Radio, Shirt, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useUser } from "@/lib/auth";
import { ROOMS, ago, listThreads, myVotes, startThread, toggleVote, type RoomId, type Thread } from "@/lib/forum";
import { useStories, type Stories } from "@/lib/stories";
import type { Photo } from "@/data/content";
import { BsPhoto } from "./broadsheet";
import { SiteShell } from "./ogcw-layout";
import { EditSection, S, T } from "./site-text";

// Shared pieces of the OGCW Forum (src/routes/forum.*), owner 18 Oct 2026:
// "take inspiration from other websites and make it better". Built like a
// community site (a Reddit-style feed with Hot / New / Top and an upvote
// rail, rooms like channels, a sidebar with the house rules) in the front
// page's bands: the black rooms bar, then the pages. Every number is counted
// from the real threads; every photo is a real OGCW story's.

export const ROOM_ICON: Record<RoomId, LucideIcon> = {
  "ogcw-10": ListOrdered,
  rap: MicVocal,
  sneakers: Footprints,
  games: Gamepad2,
  sports: Trophy,
  fashion: Shirt,
  streaming: Radio,
};

export function RoomIcon({ room, size = 16 }: { room: RoomId; size?: number }) {
  const Icon = ROOM_ICON[room];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

// Each room's picture: the newest OGCW story on its subject (no photo twice)
const SNEAKERS = /sneaker|jordan|nike|adidas|new balance|dunk|gazelle|air max|asics|yeezy|samba/i;
const FASHION = /fashion|runway|collection|supreme|palace|vogue|couture|designer|show/i;
export function roomPhotos(stories: Stories): Record<RoomId, Photo | undefined> {
  const used = new Set<string>();
  const take = (...lists: (Stories["all"][number] | undefined)[][]) => {
    for (const list of lists) {
      const story = list.find((s) => s && !used.has(s.photo.src));
      if (story) { used.add(story.photo.src); return story.photo; }
    }
    return undefined;
  };
  const text = (s: Stories["all"][number]) => `${s.kicker} ${s.title}`;
  return {
    "ogcw-10": take(stories.slot("ranking"), stories.trending),
    rap: take(stories.slot("rap-spotlight"), stories.inSection("music")),
    sneakers: take(stories.all.filter((s) => SNEAKERS.test(text(s)))),
    games: take(stories.inSection("games")),
    sports: take(stories.inSection("sports")),
    fashion: take(stories.inSection("culture").filter((s) => FASHION.test(text(s))), stories.inSection("culture")),
    streaming: take(stories.inSection("streaming")),
  };
}

export function useRoomPhotos() {
  const stories = useStories();
  return useMemo(() => roomPhotos(stories), [stories]);
}

// The forum's bar: its name, where you are and "Start a thread". The rooms
// aren't listed here (owner, 19 Oct 2026: the header already says Gaming,
// Sports…; the rooms are on the forum's pages themselves).
export function ForumShell({ room, children }: { room?: RoomId; children: ReactNode }) {
  const current = room ? ROOMS.find((item) => item.id === room) : undefined;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <SiteShell>
      <EditSection name="Blog">
        <div className="fm">
          <header className="fm-head" data-band="dark">
            <div className="fx-wrap">
              <Link to="/forum" className="fm-wordmark">OGCW <span>Forum</span></Link>
              {current && (
                <p className="fm-here">
                  <span aria-hidden="true">/</span>
                  <Link to="/forum/$room" params={{ room: current.id }}><RoomIcon room={current.id} size={14} />{current.name}</Link>
                </p>
              )}
              <div className="fm-head-actions">
                {current && <Link to="/forum" className="fm-head-link"><T k="forum.rooms.all">All rooms</T></Link>}
                {/* To the composer: on this page, or (from a thread) its room's */}
                {current && pathname !== `/forum/${current.id}`
                  ? <Link to="/forum/$room" params={{ room: current.id }} hash="compose" className="fm-head-btn" aria-label="Start a thread"><PenLine size={15} aria-hidden="true" /><span><T k="forum.new">Start a thread</T></span></Link>
                  : <a href="#compose" className="fm-head-btn" aria-label="Start a thread"><PenLine size={15} aria-hidden="true" /><span><T k="forum.new">Start a thread</T></span></a>}
              </div>
            </div>
          </header>
          <main className="fm-main">{children}</main>
        </div>
      </EditSection>
    </SiteShell>
  );
}

/** A reader's initials in a circle (OGCW's own posts in gold) */
export function Avatar({ name, official = false, size = "md" }: { name: string; official?: boolean; size?: "sm" | "md" | "lg" }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  return <span className={`fm-avatar fm-avatar-${size}`} data-official={official || undefined} aria-hidden="true">{official ? "OG" : initials}</span>;
}

export function Author({ thread }: { thread: Pick<Thread, "author_name" | "official"> }) {
  return (
    <span className={`fm-author ${thread.official ? "is-official" : ""}`}>
      {thread.author_name}
      {thread.official && <BadgeCheck size={14} strokeWidth={2} aria-label="OGCW team" />}
    </span>
  );
}

export function RoomTag({ room }: { room: RoomId }) {
  const found = ROOMS.find((item) => item.id === room);
  if (!found) return null;
  return <Link to="/forum/$room" params={{ room }} className="fm-tag"><RoomIcon room={room} size={13} />{found.name}</Link>;
}

export function VoteButton({ thread, voted, onChange, wide = false }: { thread: Thread; voted: boolean; onChange: (score: number, voted: boolean) => void; wide?: boolean }) {
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
    <button type="button" className={`fm-vote ${wide ? "fm-vote-wide" : ""}`} aria-pressed={voted} disabled={busy} onClick={click} aria-label={`${voted ? "Remove your upvote" : "Upvote"}: ${thread.score} ${thread.score === 1 ? "vote" : "votes"}`} title={user ? undefined : "Log in to vote"}>
      <ArrowBigUp size={22} strokeWidth={1.75} fill={voted ? "currentColor" : "none"} aria-hidden="true" />
      <span>{thread.score}</span>
    </button>
  );
}

export function ThreadCard({ thread, voted, onVote, showRoom = true }: { thread: Thread; voted: boolean; onVote: (score: number, voted: boolean) => void; showRoom?: boolean }) {
  return (
    <article className="fm-card">
      <VoteButton thread={thread} voted={voted} onChange={onVote} />
      <div className="fm-card-main">
        <p className="fm-meta">
          {showRoom && <RoomTag room={thread.room} />}
          <Avatar name={thread.author_name} official={thread.official} size="sm" />
          <Author thread={thread} />
          <span className="fm-dot" aria-hidden="true">·</span>
          <time dateTime={thread.last_activity_at}>{ago(thread.last_activity_at)}</time>
        </p>
        <Link to="/forum/t/$id" params={{ id: thread.id }} className="fm-card-link">
          <span className="fm-card-title">{thread.title}</span>
          <span className="fm-card-body">{thread.body.length > 200 ? `${thread.body.slice(0, 200)}…` : thread.body}</span>
        </Link>
        <p className="fm-card-foot">
          <Link to="/forum/t/$id" params={{ id: thread.id }} className="fm-chip">
            <MessageSquare size={15} strokeWidth={1.8} aria-hidden="true" />
            {thread.reply_count === 0 ? <T k="forum.reply.first">Be the first to reply</T> : `${thread.reply_count} ${thread.reply_count === 1 ? "reply" : "replies"}`}
          </Link>
        </p>
      </div>
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
  useEffect(() => { if (room) setPick(room); }, [room]);
  // A link to #compose (the "Start a thread" buttons) opens the form
  useEffect(() => {
    const check = () => { if (window.location.hash === "#compose") setOpen(true); };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);
  if (!ready) return <div className="fm-compose fm-compose-wait" id="compose" aria-hidden="true" />;
  if (!user) {
    return (
      <div className="fm-compose fm-compose-cta" id="compose">
        <p className="fm-compose-title"><T k="forum.join.title">Join the conversation.</T></p>
        <p className="fm-compose-copy"><T k="forum.join.copy">Reading is open to everyone; log in or create a free OGCW account to post, reply and vote.</T></p>
        <div className="fm-compose-actions">
          <Link to="/login" className="fx-btn"><T k="forum.join.login">Log in</T></Link>
          <Link to="/signup" className="fx-btn fx-btn-ghost fm-ghost"><T k="forum.join.signup">Create an account</T></Link>
        </div>
      </div>
    );
  }
  if (!open) {
    return (
      <button type="button" className="fm-compose fm-compose-open" id="compose" onClick={() => setOpen(true)}>
        <Avatar name={user.name} />
        <span className="fm-compose-prompt"><T k="forum.new.prompt">Start a thread…</T></span>
        <PenLine size={18} aria-hidden="true" />
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
    <form className="fm-compose fm-form" id="compose" onSubmit={submit}>
      <p className="fm-form-head"><Avatar name={user.name} size="sm" /> <T k="forum.new">Start a thread</T> <span className="fm-compose-as">as {user.name}</span></p>
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
    </form>
  );
}

// ------------------------------------------------------------ Threads

export type Sort = "hot" | "new" | "top";
const hours = (iso: string) => Math.max(0, (Date.now() - Date.parse(iso)) / 3_600_000);
/** "Hot": votes and replies, cooling off as the thread gets older */
const heat = (thread: Thread) => (thread.score + 2 * thread.reply_count + 1) / Math.pow(hours(thread.last_activity_at) + 2, 1.3);
export function sortThreads(threads: Thread[], sort: Sort) {
  const list = [...threads];
  if (sort === "hot") return list.sort((a, b) => heat(b) - heat(a) || Number(b.official) - Number(a.official));
  if (sort === "top") return list.sort((a, b) => b.score - a.score || b.reply_count - a.reply_count || b.last_activity_at.localeCompare(a.last_activity_at));
  return list.sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at));
}

/** Every thread of a room (or all rooms), loaded once; sorted here */
export function useThreads(room?: RoomId) {
  const { user } = useUser();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setThreads(null);
    setError(null);
    listThreads({ ...(room ? { room } : {}), sort: "new", limit: 200 }).then(setThreads).catch((err: Error) => setError(err.message));
  }, [room]);
  useEffect(() => { if (user) myVotes().then(setVoted).catch(() => {}); else setVoted(new Set()); }, [user]);
  const onVote = (id: string) => (score: number, on: boolean) => {
    setThreads((all) => all?.map((thread) => (thread.id === id ? { ...thread, score } : thread)) ?? null);
    setVoted((set) => { const next = new Set(set); if (on) next.add(id); else next.delete(id); return next; });
  };
  return { threads, voted, onVote, error };
}

/** Threads, replies and votes, counted from the threads themselves */
export function forumStats(threads: Thread[]) {
  return {
    threads: threads.length,
    replies: threads.reduce((sum, t) => sum + t.reply_count, 0),
    votes: threads.reduce((sum, t) => sum + t.score, 0),
    last: threads.reduce<string | null>((latest, t) => (!latest || t.last_activity_at > latest ? t.last_activity_at : latest), null),
  };
}

const SORTS: { id: Sort; label: string; icon: LucideIcon }[] = [
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New", icon: Clock },
  { id: "top", label: "Top", icon: TrendingUp },
];

export function ThreadFeed({ room, data }: { room?: RoomId; data: ReturnType<typeof useThreads> }) {
  const [sort, setSort] = useState<Sort>("hot");
  const { threads, voted, onVote, error } = data;
  const sorted = useMemo(() => (threads ? sortThreads(threads, sort) : null), [threads, sort]);
  return (
    <section className="fm-feed" aria-labelledby="feed-title">
      <div className="fm-feed-head">
        <h2 id="feed-title" className="fm-feed-title"><T k="forum.feed">The conversation</T></h2>
        <div className="fm-sort" role="group" aria-label="Sort threads">
          {SORTS.map((item) => (
            <button key={item.id} type="button" aria-pressed={sort === item.id} onClick={() => setSort(item.id)}>
              <item.icon size={15} strokeWidth={1.9} aria-hidden="true" /><T k={`forum.sort.${item.id}`}>{item.label}</T>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="fm-error">{error}</p>}
      {!sorted && !error && (
        <ol className="fm-cards" aria-hidden="true">
          {[0, 1, 2].map((n) => <li key={n}><div className="fm-card fm-card-ghost"><span /><span><i /><i /><i /></span></div></li>)}
        </ol>
      )}
      {sorted?.length === 0 && (
        <div className="fm-empty">
          {room && <RoomIcon room={room} size={28} />}
          <p><T k="forum.empty">No threads here yet. Start the first one.</T></p>
          <a href="#compose" className="fx-btn"><T k="forum.new">Start a thread</T></a>
        </div>
      )}
      {sorted && sorted.length > 0 && (
        <ol className="fm-cards">
          {sorted.map((thread) => <li key={thread.id}><ThreadCard thread={thread} voted={voted.has(thread.id)} onVote={onVote(thread.id)} showRoom={!room} /></li>)}
        </ol>
      )}
    </section>
  );
}

// ------------------------------------------------------------ The sidebar

export function SideBox({ title, k, children }: { title: string; k: string; children: ReactNode }) {
  return (
    <section className="fm-box" aria-label={title}>
      <p className="fm-box-title"><T k={k}>{title}</T></p>
      {children}
    </section>
  );
}

export function HouseRules() {
  return (
    <SideBox title="House rules" k="forum.rules.title">
      <ol className="fm-rules-list">
        <li><T k="forum.rules.1">Keep it about culture.</T></li>
        <li><T k="forum.rules.2">Keep it civil: no personal attacks.</T></li>
        <li><T k="forum.rules.3">No spam and no self-promotion.</T></li>
        <li><T k="forum.rules.4">Never post anyone’s private details.</T></li>
      </ol>
    </SideBox>
  );
}

/** The rooms as a list, each with its number of threads */
export function RoomList({ threads, current }: { threads: Thread[] | null; current?: RoomId }) {
  return (
    <SideBox title="Rooms" k="forum.rooms">
      <ul className="fm-roomlist">
        {ROOMS.map((room) => {
          const count = threads?.filter((t) => t.room === room.id).length;
          return (
            <li key={room.id}>
              <Link to="/forum/$room" params={{ room: room.id }} className="fm-roomlist-link" data-on={current === room.id || undefined}>
                <span className="fm-roomlist-icon"><RoomIcon room={room.id} size={16} /></span>
                <span className="fm-roomlist-name">{room.name}</span>
                {count !== undefined && <span className="fm-roomlist-count">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </SideBox>
  );
}

/** The newest OGCW stories, to start a conversation from */
export function FreshStories() {
  const stories = useStories();
  return (
    <SideBox title="Talk about the news" k="forum.fresh">
      <ol className="fm-fresh">
        {stories.all.slice(0, 4).map((story) => (
          <li key={story.slug}>
            <Link to="/news/$slug" params={{ slug: story.slug }} className="fm-fresh-link">
              <BsPhoto photo={story.photo} className="fm-fresh-photo" />
              <span>
                <span className="fm-fresh-kicker"><S story={story} f="kicker" /></span>
                <span className="fm-fresh-title"><S story={story} f="title" /></span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <Link to="/news" className="fx-more fm-box-more"><T k="forum.fresh.more">All the news</T> <ArrowRight size={14} aria-hidden="true" /></Link>
    </SideBox>
  );
}
