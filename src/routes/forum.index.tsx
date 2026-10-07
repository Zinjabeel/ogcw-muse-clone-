import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Composer, ForumShell, ThreadList } from "../components/forum-kit";
import { ROOMS } from "@/lib/forum";
import { T } from "@/components/site-text";

// The forum's front: what it is, start a thread, the rooms, and the latest
// (or top) threads across every room
export const Route = createFileRoute("/forum/")({
  head: () => ({ meta: [{ title: "The OGCW Forum" }, { name: "description", content: "Talk culture with OGCW readers: rap, sneakers, games, sports, fashion, streaming and the OGCW 10." }, { property: "og:title", content: "The OGCW Forum" }] }),
  component: ForumHome,
});

function ForumHome() {
  return (
    <ForumShell>
      <div className="fm-intro">
        <div>
          <p className="fx-kicker"><span className="fx-tick" aria-hidden="true" /><T k="forum.kicker">Community</T></p>
          <h1 className="fm-title"><T k="forum.title">The OGCW Forum</T></h1>
          <p className="fm-lede"><T k="forum.lede">Argue the rankings, swap release-day stories and vote on what matters. Seven rooms, one rule: keep it about culture.</T></p>
        </div>
        <Composer />
      </div>
      <div className="fm-grid">
        <ThreadList />
        <aside className="fm-side" aria-label="Rooms">
          <p className="fx-col-head"><T k="forum.rooms">Rooms</T></p>
          <ul className="fm-room-cards">
            {ROOMS.map((room) => (
              <li key={room.id}>
                <Link to="/forum/$room" params={{ room: room.id }} className="fm-room-card">
                  <span className="fm-room-name"># {room.name}</span>
                  <span className="fm-room-blurb">{room.blurb}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </ForumShell>
  );
}
