import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Link2, MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Author, Avatar, ForumShell, HouseRules, RoomIcon, RoomTag, SideBox, VoteButton, useRoomPhotos } from "../components/forum-kit";
import { BsPhoto } from "../components/broadsheet";
import { useUser } from "@/lib/auth";
import { ago, deleteReply, deleteThread, getRoom, getThread, listThreads, myVotes, reply, type Reply, type Thread } from "@/lib/forum";
import { T } from "@/components/site-text";

// A thread: the opening post with its upvote, the replies as a conversation
// (each with the reader's initials), the reply box for signed-in readers;
// beside it the room, more threads from the room and the house rules.
// Readers can delete their own posts.
export const Route = createFileRoute("/forum/t/$id")({
  head: () => ({ meta: [{ title: "Thread — OGCW Forum" }] }),
  component: ThreadPage,
});

function CopyLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* the address bar still has it */ }
  };
  return (
    <button type="button" className="fm-chip" onClick={copy}>
      <Link2 size={15} strokeWidth={1.8} aria-hidden="true" /> <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
    </button>
  );
}

/** Other threads in the same room */
function MoreInRoom({ thread }: { thread: Thread }) {
  const [more, setMore] = useState<Thread[] | null>(null);
  useEffect(() => {
    listThreads({ room: thread.room, sort: "new", limit: 6 }).then((list) => setMore(list.filter((t) => t.id !== thread.id).slice(0, 4))).catch(() => setMore([]));
  }, [thread.room, thread.id]);
  if (!more?.length) return null;
  return (
    <SideBox title="More in this room" k="forum.more">
      <ul className="fm-more-list">
        {more.map((item) => (
          <li key={item.id}>
            <Link to="/forum/t/$id" params={{ id: item.id }} className="fm-more-link">
              <span className="fm-more-title">{item.title}</span>
              <span className="fm-more-meta">{item.reply_count} {item.reply_count === 1 ? "reply" : "replies"} · {ago(item.last_activity_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SideBox>
  );
}

function ThreadPage() {
  const { id } = Route.useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const photos = useRoomPhotos();
  const [data, setData] = useState<{ thread: Thread; replies: Reply[] } | null | undefined>(undefined);
  const [voted, setVoted] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => getThread(id).then(setData).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, [id]);
  useEffect(() => { if (user) myVotes().then((set) => setVoted(set.has(id))).catch(() => {}); }, [user, id]);
  useEffect(() => { if (data?.thread) document.title = `${data.thread.title} — OGCW Forum`; }, [data]);

  if (data === undefined) {
    return (
      <ForumShell>
        <section className="fx-band fm-feed-band" data-band="light"><div className="fx-wrap"><p className="fm-loading">{error ?? "Loading the thread…"}</p></div></section>
      </ForumShell>
    );
  }
  if (data === null) {
    return (
      <ForumShell>
        <section className="fx-band fm-feed-band" data-band="light">
          <div className="fx-wrap fm-gone">
            <h1 className="fm-title"><T k="forum.gone">This thread isn’t here any more.</T></h1>
            <Link to="/forum" className="fx-more"><ArrowLeft size={15} aria-hidden="true" /> Back to the forum</Link>
          </div>
        </section>
      </ForumShell>
    );
  }
  const { thread, replies } = data;
  const room = getRoom(thread.room);
  const photo = photos[thread.room];

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await reply(user, thread.id, text);
      setText("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };
  const removeThread = async () => {
    if (!window.confirm("Delete your thread and its replies? This can’t be undone.")) return;
    try { await deleteThread(thread.id); navigate({ to: "/forum" }); } catch (err) { setError((err as Error).message); }
  };
  const removeReply = async (replyId: string) => {
    if (!window.confirm("Delete your reply? This can’t be undone.")) return;
    try { await deleteReply(replyId); await load(); } catch (err) { setError((err as Error).message); }
  };

  return (
    <ForumShell room={thread.room}>
      <section className="fx-band fm-feed-band fm-thread-band" data-band="light" aria-labelledby="thread-title">
        <div className="fx-wrap fm-layout">
          <div className="fm-thread-main">
            <nav className="fm-crumbs" aria-label="Breadcrumb">
              <Link to="/forum"><T k="forum.crumb">Forum</T></Link>
              <span aria-hidden="true">/</span>
              {room && <Link to="/forum/$room" params={{ room: room.id }}>{room.name}</Link>}
            </nav>

            <article className="fm-op">
              <VoteButton thread={thread} voted={voted} wide onChange={(score, on) => { setData({ thread: { ...thread, score }, replies }); setVoted(on); }} />
              <div className="fm-op-main">
                <p className="fm-meta">
                  <RoomTag room={thread.room} />
                  <Avatar name={thread.author_name} official={thread.official} size="sm" />
                  <Author thread={thread} />
                  <span className="fm-dot" aria-hidden="true">·</span>
                  <time dateTime={thread.created_at}>{ago(thread.created_at)}</time>
                </p>
                <h1 id="thread-title" className="fm-op-title">{thread.title}</h1>
                <p className="fm-op-body">{thread.body}</p>
                <p className="fm-card-foot">
                  <a href="#reply" className="fm-chip"><MessageSquare size={15} strokeWidth={1.8} aria-hidden="true" /> <T k="forum.reply.go">Reply</T></a>
                  <CopyLink />
                  {user && thread.author_id === user.id && <button type="button" className="fm-chip fm-delete" onClick={removeThread}><Trash2 size={14} aria-hidden="true" /> Delete</button>}
                </p>
              </div>
            </article>

            <section className="fm-replies-section" aria-labelledby="replies-title">
              <h2 id="replies-title" className="fm-feed-title">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h2>
              {replies.length === 0 && <p className="fm-replies-empty"><T k="forum.replies.none">No replies yet. Start it off.</T></p>}
              <ol className="fm-reply-list">
                {replies.map((item) => (
                  <li key={item.id} className="fm-reply">
                    <Avatar name={item.author_name} />
                    <div className="fm-reply-main">
                      <p className="fm-meta"><span className="fm-author">{item.author_name}</span><span className="fm-dot" aria-hidden="true">·</span><time dateTime={item.created_at}>{ago(item.created_at)}</time></p>
                      <p className="fm-reply-body">{item.body}</p>
                      {user && item.author_id === user.id && <button type="button" className="fm-chip fm-delete" onClick={() => removeReply(item.id)}><Trash2 size={14} aria-hidden="true" /> Delete</button>}
                    </div>
                  </li>
                ))}
              </ol>
              <div id="reply">
                {user ? (
                  <form className="fm-compose fm-form fm-reply-form" onSubmit={send}>
                    <p className="fm-form-head"><Avatar name={user.name} size="sm" /> <span>Reply as {user.name}</span></p>
                    <label className="fm-field">
                      <span className="sr-only">Your reply</span>
                      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} maxLength={3000} required placeholder="Add to the conversation" />
                    </label>
                    {error && <p className="fm-error" role="alert">{error}</p>}
                    <div className="fm-compose-actions"><button type="submit" className="fx-btn" disabled={busy}>{busy ? "Posting…" : "Post reply"}</button></div>
                  </form>
                ) : (
                  <div className="fm-compose fm-compose-cta">
                    <p className="fm-compose-title"><T k="forum.reply.title">Want to reply?</T></p>
                    <p className="fm-compose-copy"><T k="forum.reply.copy">Log in or create a free OGCW account.</T></p>
                    <div className="fm-compose-actions"><Link to="/login" className="fx-btn">Log in</Link><Link to="/signup" className="fx-btn fx-btn-ghost fm-ghost">Create an account</Link></div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="fm-side">
            {room && (
              <Link to="/forum/$room" params={{ room: room.id }} className="fm-sideroom">
                {photo && <BsPhoto photo={photo} className="fm-sideroom-photo" />}
                <span className="fm-sideroom-text">
                  <span className="fm-sideroom-name"><RoomIcon room={room.id} size={16} /> {room.name}</span>
                  <span className="fm-sideroom-blurb">{room.blurb}</span>
                  <span className="fm-sideroom-go"><T k="forum.room.open">Open the room</T> <ArrowRight size={14} aria-hidden="true" /></span>
                </span>
              </Link>
            )}
            <MoreInRoom thread={thread} />
            <HouseRules />
          </aside>
        </div>
      </section>
    </ForumShell>
  );
}
