import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { Composer, ForumShell, HouseRules, RoomIcon, RoomList, ThreadFeed, forumStats, useRoomPhotos, useThreads } from "../components/forum-kit";
import { BsPhoto } from "../components/broadsheet";
import { ago, getRoom } from "@/lib/forum";
import { T } from "@/components/site-text";

// One room of the forum: a header on the room's photo with its numbers and
// the composer, then its threads (Hot / New / Top) beside the house rules
// and the other rooms
export const Route = createFileRoute("/forum/$room")({
  beforeLoad: ({ params }) => {
    if (!getRoom(params.room)) throw notFound();
  },
  head: ({ params }) => {
    const room = getRoom(params.room);
    return { meta: [{ title: `${room?.name ?? "Forum"} — OGCW Forum` }, { name: "description", content: room?.blurb ?? "" }] };
  },
  component: RoomPage,
});

function RoomPage() {
  const { room: id } = Route.useParams();
  const room = getRoom(id);
  const photo = useRoomPhotos()[room?.id ?? "ogcw-10"];
  const data = useThreads(room?.id);
  const all = useThreads();
  const stats = useMemo(() => forumStats(data.threads ?? []), [data.threads]);
  if (!room) return null;
  return (
    <ForumShell room={room.id}>
      <section className="fx-band fm-roomhero" data-band="dark" aria-labelledby="room-title">
        {photo && <BsPhoto photo={photo} className="fm-roomhero-photo" eager />}
        <div className="fx-wrap fm-roomhero-grid">
          <div>
            <p className="fx-kicker"><RoomIcon room={room.id} size={15} /> <T k="forum.room.kicker">Room</T></p>
            <h1 id="room-title" className="fm-title">{room.name}</h1>
            <p className="fm-lede">{room.blurb}</p>
            <dl className="fm-stats">
              <div><dt><T k="forum.stat.threads">Threads</T></dt><dd>{data.threads ? stats.threads : "–"}</dd></div>
              <div><dt><T k="forum.stat.replies">Replies</T></dt><dd>{data.threads ? stats.replies : "–"}</dd></div>
              <div><dt><T k="forum.stat.votes">Votes</T></dt><dd>{data.threads ? stats.votes : "–"}</dd></div>
              {stats.last && <div><dt><T k="forum.stat.last">Last post</T></dt><dd>{ago(stats.last)}</dd></div>}
            </dl>
          </div>
          <Composer room={room.id} />
        </div>
      </section>

      <section className="fx-band fm-feed-band" data-band="light" aria-label="Threads">
        <div className="fx-wrap fm-layout">
          <ThreadFeed room={room.id} data={data} />
          <aside className="fm-side">
            <HouseRules />
            <RoomList threads={all.threads} current={room.id} />
          </aside>
        </div>
      </section>
    </ForumShell>
  );
}
