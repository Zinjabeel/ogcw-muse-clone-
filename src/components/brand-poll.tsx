import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { myPollVote, pollTotals, votePoll } from "@/lib/polls";
import { T } from "./site-text";

// The favourite-brand vote under Culture & fashion (owner, 16 Oct 2026). Eight
// brands as a list; once you vote, every row shows its share of the votes as
// a bar, yours ticked, and you can change your mind. Real counts from
// src/lib/polls.ts; nothing is shown until there are votes to show.

const POLL = "favourite-brand-2026";
const BRANDS = [
  { id: "nike", name: "Nike" },
  { id: "adidas", name: "Adidas" },
  { id: "new-balance", name: "New Balance" },
  { id: "corteiz", name: "Corteiz" },
  { id: "stussy", name: "Stüssy" },
  { id: "supreme", name: "Supreme" },
  { id: "represent", name: "Represent" },
  { id: "aime-leon-dore", name: "Aimé Leon Dore" },
] as const;

export function BrandPoll() {
  const [mine, setMine] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [changing, setChanging] = useState(false);

  // A browser that has voted goes straight to the results
  useEffect(() => {
    const saved = myPollVote(POLL);
    if (!saved || !BRANDS.some((brand) => brand.id === saved)) return;
    setMine(saved);
    pollTotals(POLL).then(setCounts).catch(() => {});
  }, []);

  const vote = async (choice: string) => {
    if (status === "sending" || (choice === mine && !changing)) return;
    setStatus("sending");
    try {
      await votePoll(POLL, choice);
      setMine(choice);
      setChanging(false);
      setCounts(await pollTotals(POLL));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const total = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : 0;
  const showing = !!mine && !!counts && !changing;

  return (
    <section className="fx-poll" aria-labelledby="brand-poll-title">
      <p className="fx-label"><T k="front.poll.brand.kicker">Reader poll</T></p>
      <h3 id="brand-poll-title" className="fx-poll-q"><T k="front.poll.brand.q">Your favourite brand this year?</T></h3>
      <ul className="fx-poll-list">
        {BRANDS.map((brand) => {
          const votes = counts?.[brand.id] ?? 0;
          const share = total ? Math.round((votes * 100) / total) : 0;
          const picked = mine === brand.id;
          return (
            <li key={brand.id}>
              <button
                type="button"
                className="fx-poll-option"
                data-picked={picked || undefined}
                aria-pressed={picked}
                disabled={status === "sending"}
                onClick={() => vote(brand.id)}
                style={showing ? { ["--share" as string]: `${share}%` } : undefined}
              >
                {showing && <span className="fx-poll-bar" aria-hidden="true" />}
                <span className="fx-poll-name">{picked && <Check size={14} strokeWidth={3} aria-hidden="true" />}{brand.name}</span>
                {showing && <span className="fx-poll-share">{share}%</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="fx-poll-foot" aria-live="polite">
        {status === "error" ? (
          <T k="front.poll.error">Your vote didn’t go through. Try again.</T>
        ) : showing ? (
          <>
            {total.toLocaleString("en-GB")} {total === 1 ? <T k="front.poll.vote">vote</T> : <T k="front.poll.votes">votes</T>} ·{" "}
            <button type="button" className="fx-poll-change" onClick={() => setChanging(true)}><T k="front.poll.change">Change my vote</T></button>
          </>
        ) : (
          <T k="front.poll.pick">Pick one to see how everyone voted.</T>
        )}
      </p>
    </section>
  );
}
