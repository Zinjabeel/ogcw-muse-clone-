import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { ForumShell, VoteButton } from "../components/forum-kit";
import { useUser } from "@/lib/auth";
import { ago, deleteReply, deleteThread, getRoom, getThread, myVotes, reply, type Reply, type Thread } from "@/lib/forum";
import { T } from "@/components/site-text";

// A thread: the opening post with its upvote, the replies in order, and the
// reply box for signed-in readers. Readers can delete their own posts.
export const Route = createFileRoute("/forum/t/$id")({
  head: () => ({ meta: [{ title: "Thread — OGCW Forum" }] }),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [data, setData] = useState<{ thread: Thread; replies: Reply[] } | null | undefined>(undefined);
  const [voted, setVoted] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => getThread(id).then(setData).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, [id]);
  useEffect(() => { if (user) myVotes().then((set) => setVoted(set.has(id))).catch(() => {}); }, [user, id]);
  useEffect(() => { if (data?.thread) document.title = `${data.thread.title} — OGCW Forum`; }, [data]);

  if (data === undefined) return <ForumShell><p className="fm-loading">{error ?? "Loading the thread…"}</p></ForumShell>;
  if (data === null) return <ForumShell><div className="fm-intro"><h1 className="fm-title"><T k="forum.gone">This thread isn’t here any more.</T></h1><Link to="/forum" className="fx-more"><ArrowLeft size={15} aria-hidden="true" /> Back to the forum</Link></div></ForumShell>;
  const { thread, replies } = data;
  const room = getRoom(thread.room);

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
      <div className="fm-thread-page">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/forum">Forum</Link> <span aria-hidden="true">/</span> {room && <Link to="/forum/$room" params={{ room: room.id }}>{room.name}</Link>}</nav>
        <article className="fm-op">
          <VoteButton thread={thread} voted={voted} onChange={(score, on) => { setData({ thread: { ...thread, score }, replies }); setVoted(on); }} />
          <div>
            <p className="fm-thread-meta">
              <span className={`fm-author ${thread.official ? "is-official" : ""}`}>{thread.official && <BadgeCheck size={13} aria-hidden="true" />}{thread.author_name}</span>
              <span>· {ago(thread.created_at)}</span>
            </p>
            <h1 className="fm-op-title">{thread.title}</h1>
            <p className="fm-op-body">{thread.body}</p>
            {user && thread.author_id === user.id && <button type="button" className="fm-delete" onClick={removeThread}><Trash2 size={14} aria-hidden="true" /> Delete</button>}
          </div>
        </article>

        <section aria-labelledby="replies-title">
          <h2 id="replies-title" className="fx-col-head">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h2>
          <ol className="fm-reply-list">
            {replies.map((item) => (
              <li key={item.id} className="fm-reply">
                <p className="fm-thread-meta"><span className="fm-author">{item.author_name}</span> <span>· {ago(item.created_at)}</span></p>
                <p className="fm-reply-body">{item.body}</p>
                {user && item.author_id === user.id && <button type="button" className="fm-delete" onClick={() => removeReply(item.id)}><Trash2 size={14} aria-hidden="true" /> Delete</button>}
              </li>
            ))}
          </ol>
          {user ? (
            <form className="fm-compose fm-form" onSubmit={send}>
              <label className="fm-field">
                <span>Reply as {user.name}</span>
                <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} maxLength={3000} required />
              </label>
              {error && <p className="fm-error" role="alert">{error}</p>}
              <div className="fm-compose-actions"><button type="submit" className="fx-btn" disabled={busy}>{busy ? "Posting…" : "Post reply"}</button></div>
            </form>
          ) : (
            <div className="fm-compose fm-compose-cta">
              <p><strong><T k="forum.reply.title">Want to reply?</T></strong> <T k="forum.reply.copy">Log in or create a free OGCW account.</T></p>
              <div className="fm-compose-actions"><Link to="/login" className="fx-btn">Log in</Link><Link to="/signup" className="fx-btn fx-btn-ghost fm-ghost">Create an account</Link></div>
            </div>
          )}
        </section>
      </div>
    </ForumShell>
  );
}
