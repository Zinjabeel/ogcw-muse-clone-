import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquare } from "lucide-react";
import { useMemo } from "react";
import { Author, Avatar, Composer, ForumShell, FreshStories, HouseRules, RoomIcon, RoomTag, ThreadFeed, forumStats, sortThreads, useRoomPhotos, useThreads } from "../components/forum-kit";
import { BsPhoto } from "../components/broadsheet";
import { useUser } from "@/lib/auth";
import { ROOMS, ago, type Thread } from "@/lib/forum";
import { T } from "@/components/site-text";

// The forum's front: what it is with the live numbers and the featured
// debate; the rooms as photo cards; then the conversation (Hot / New / Top)
// beside the composer, the house rules and the newest stories.
export const Route = createFileRoute("/forum/")({
  head: () => ({ meta: [{ title: "The OGCW Forum" }, { name: "description", content: "Talk culture with OGCW readers: rap, sneakers, games, sports, fashion, streaming and the OGCW 10." }, { property: "og:title", content: "The OGCW Forum" }] }),
  component: ForumHome,
});

const num = (n: number) => n.toLocaleString("en-GB");

function Featured({ thread }: { thread: Thread }) {
  return (
    <article className="fm-featured">
      <p className="fm-featured-label"><T k="forum.featured">Featured debate</T></p>
      <p className="fm-meta"><RoomTag room={thread.room} /><Avatar name={thread.author_name} official={thread.official} size="sm" /><Author thread={thread} /><span className="fm-dot" aria-hidden="true">·</span><time dateTime={thread.last_activity_at}>{ago(thread.last_activity_at)}</time></p>
      <h2 className="fm-featured-title"><Link to="/forum/t/$id" params={{ id: thread.id }}>{thread.title}</Link></h2>
      <p className="fm-featured-body">{thread.body}</p>
      <div className="fm-featured-foot">
        <Link to="/forum/t/$id" params={{ id: thread.id }} className="fx-btn"><T k="forum.featured.join">Join the debate</T> <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
        <span className="fm-featured-stat">
          <MessageSquare size={15} aria-hidden="true" />
          {thread.reply_count + thread.score === 0
            ? <T k="forum.reply.first">Be the first to reply</T>
            : `${thread.reply_count} ${thread.reply_count === 1 ? "reply" : "replies"} · ${thread.score} ${thread.score === 1 ? "vote" : "votes"}`}
        </span>
      </div>
    </article>
  );
}

function ForumHome() {
  const data = useThreads();
  const { user } = useUser();
  const photos = useRoomPhotos();
  const threads = data.threads;
  const stats = useMemo(() => forumStats(threads ?? []), [threads]);
  // The featured debate: the most votes and replies, else the hottest
  const featured = useMemo(() => {
    if (!threads?.length) return undefined;
    const busiest = sortThreads(threads, "top")[0]!;
    return busiest.score + busiest.reply_count > 0 ? busiest : sortThreads(threads, "hot")[0];
  }, [threads]);

  return (
    <ForumShell>
      {/* What it is, the numbers and the featured debate */}
      <section className="fx-band fm-hero" data-band="dark" aria-labelledby="forum-title">
        <div className="fx-wrap fm-hero-grid">
          <div className="fm-hero-text">
            <p className="fx-kicker"><T k="forum.kicker">Community</T></p>
            <h1 id="forum-title" className="fm-title"><T k="forum.title">The OGCW Forum</T></h1>
            <p className="fm-lede"><T k="forum.lede">Argue the rankings, swap release-day stories and vote on what matters. Seven rooms, one rule: keep it about culture.</T></p>
            <div className="fm-hero-ctas">
              {user ? (
                <a href="#compose" className="fx-btn"><T k="forum.new">Start a thread</T> <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></a>
              ) : (
                <>
                  <Link to="/signup" className="fx-btn"><T k="forum.join.signup">Create an account</T></Link>
                  <Link to="/login" className="fx-btn fx-btn-ghost fm-ghost"><T k="forum.join.login">Log in</T></Link>
                </>
              )}
            </div>
            <dl className="fm-stats">
              <div><dt><T k="forum.stat.rooms">Rooms</T></dt><dd>{ROOMS.length}</dd></div>
              <div><dt><T k="forum.stat.threads">Threads</T></dt><dd>{threads ? num(stats.threads) : "–"}</dd></div>
              {stats.replies > 0 && <div><dt><T k="forum.stat.replies">Replies</T></dt><dd>{num(stats.replies)}</dd></div>}
              {stats.votes > 0 && <div><dt><T k="forum.stat.votes">Votes</T></dt><dd>{num(stats.votes)}</dd></div>}
              {stats.last && <div><dt><T k="forum.stat.last">Last post</T></dt><dd>{ago(stats.last)}</dd></div>}
            </dl>
          </div>
          {featured ? <Featured thread={featured} /> : <div className="fm-featured fm-featured-ghost" aria-hidden="true" />}
        </div>
      </section>

      {/* The rooms */}
      <section className="fx-band fm-rooms-band" data-band="grey" aria-labelledby="rooms-title">
        <div className="fx-wrap">
          <header className="fx-head">
            <div>
              <p className="fx-kicker"><T k="forum.rooms.kicker">Pick a room</T></p>
              <h2 id="rooms-title" className="fx-title"><T k="forum.rooms.title">The rooms</T></h2>
            </div>
          </header>
          <ul className="fm-roomgrid">
            {ROOMS.map((room) => {
              const inRoom = threads?.filter((t) => t.room === room.id) ?? [];
              const latest = inRoom[0];
              const photo = photos[room.id];
              return (
                <li key={room.id}>
                  <Link to="/forum/$room" params={{ room: room.id }} className="fm-roomcard">
                    <span className="fm-roomcard-photo">{photo && <BsPhoto photo={photo} className="fm-roomcard-img" />}</span>
                    <span className="fm-roomcard-text">
                      <span className="fm-roomcard-icon"><RoomIcon room={room.id} size={18} /></span>
                      <span className="fm-roomcard-name">{room.name}</span>
                      <span className="fm-roomcard-blurb">{room.blurb}</span>
                      <span className="fm-roomcard-meta">
                        {threads ? `${inRoom.length} ${inRoom.length === 1 ? "thread" : "threads"}${latest ? ` · active ${ago(latest.last_activity_at)}` : ""}` : " "}
                      </span>
                      {latest && <span className="fm-roomcard-latest">{latest.title}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <a href="#compose" className="fm-roomcard fm-roomcard-new">
                <span className="fm-roomcard-text">
                  <span className="fm-roomcard-name"><T k="forum.rooms.new">Got something to say?</T></span>
                  <span className="fm-roomcard-blurb"><T k="forum.rooms.new.copy">Start a thread in any room. Ask, argue, rank.</T></span>
                  <span className="fm-roomcard-go"><T k="forum.new">Start a thread</T> <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* The conversation */}
      <section className="fx-band fm-feed-band" data-band="light" aria-label="Threads">
        <div className="fx-wrap fm-layout">
          <ThreadFeed data={data} />
          <aside className="fm-side">
            <Composer />
            <HouseRules />
            <FreshStories />
          </aside>
        </div>
      </section>
    </ForumShell>
  );
}
