import { createFileRoute, notFound } from "@tanstack/react-router";
import { Composer, ForumShell, ThreadList } from "../components/forum-kit";
import { getRoom } from "@/lib/forum";

// One room of the forum: its name, start a thread in it, its threads
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
  if (!room) return null;
  return (
    <ForumShell room={room.id}>
      <div className="fm-intro">
        <div>
          <p className="fx-kicker"><span className="fx-tick" aria-hidden="true" />Room</p>
          <h1 className="fm-title"># {room.name}</h1>
          <p className="fm-lede">{room.blurb}</p>
        </div>
        <Composer room={room.id} />
      </div>
      <ThreadList room={room.id} />
    </ForumShell>
  );
}
