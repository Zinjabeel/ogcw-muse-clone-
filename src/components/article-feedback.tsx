import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { getFeedback, sendFeedback, sendFeedbackNote, type Answer, type FeedbackCounts } from "@/lib/feedback";
import { storePreference } from "@/lib/consent";

// The question at the end of every story: "Was this helpful?", or the
// story's own ("Are you going?"). One answer per browser. Once answered,
// the reader sees how everyone has answered so far and can add a note.

const storageKey = (slug: string) => `ogcw-answer-${slug}`;

export function ArticleFeedback({ slug, question }: { slug: string; question: string }) {
  const [mine, setMine] = useState<Answer | null>(null);
  const [counts, setCounts] = useState<FeedbackCounts | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [note, setNote] = useState("");
  const [noteState, setNoteState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const helpful = question === "Was this helpful?";

  // A reader who has answered before goes straight to the results
  useEffect(() => {
    setMine(null); setCounts(null); setStatus("idle"); setNote(""); setNoteState("idle");
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey(slug));
    } catch {
      // storage blocked: ask again
    }
    if (saved !== "yes" && saved !== "no") return;
    const answer = saved;
    getFeedback({ data: slug })
      .then((result) => {
        if (result[answer] === 0) return; // the count has started again since
        setMine(answer);
        setCounts(result);
      })
      .catch(() => {});
  }, [slug]);

  const answer = async (value: Answer) => {
    if (mine || status === "sending") return;
    setStatus("sending");
    try {
      const result = await sendFeedback({ data: { slug, answer: value } });
      setMine(value);
      setCounts(result);
      setStatus("idle");
      storePreference(storageKey(slug), value); // remembered only if the reader allows preferences
    } catch {
      setStatus("error");
    }
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim() || noteState === "sending") return;
    setNoteState("sending");
    try {
      await sendFeedbackNote({ data: { slug, answer: mine, text: note } });
      setNoteState("sent");
    } catch {
      setNoteState("error");
    }
  };

  const total = counts ? counts.yes + counts.no : 0;
  const yesShare = total ? Math.round((counts!.yes / total) * 100) : 0;

  return (
    <section className="fb" aria-labelledby={`fb-${slug}`}>
      <p className="fb-kicker">Your turn</p>
      <h2 id={`fb-${slug}`} className="fb-question">{question}</h2>

      {!counts ? (
        <>
          <div className="fb-buttons">
            <button type="button" className="fb-button" disabled={status === "sending"} onClick={() => answer("yes")}>
              {helpful && <ThumbsUp size={16} strokeWidth={1.75} aria-hidden="true" />} Yes
            </button>
            <button type="button" className="fb-button" disabled={status === "sending"} onClick={() => answer("no")}>
              {helpful && <ThumbsDown size={16} strokeWidth={1.75} aria-hidden="true" />} No
            </button>
          </div>
          <p className="fb-note" aria-live="polite">
            {status === "sending" ? "Sending…" : status === "error" ? "That didn’t go through. Try again." : "One tap, and you’ll see how other readers answered."}
          </p>
        </>
      ) : (
        <div className="fb-result" aria-live="polite">
          <div className="fb-bars">
            <div className="fb-bar" data-mine={mine === "yes" || undefined} style={{ "--share": `${yesShare}%` } as CSSProperties}>
              <span>Yes</span><strong>{yesShare}%</strong>
            </div>
            <div className="fb-bar" data-mine={mine === "no" || undefined} style={{ "--share": `${100 - yesShare}%` } as CSSProperties}>
              <span>No</span><strong>{100 - yesShare}%</strong>
            </div>
          </div>
          <p className="fb-note">
            <Check size={14} strokeWidth={2.5} aria-hidden="true" /> You said {mine}. {total.toLocaleString("en-GB")} {total === 1 ? "reader has" : "readers have"} answered so far.
          </p>

          {noteState === "sent" ? (
            <p className="fb-thanks">Thanks. Every note goes to the desk that wrote this story.</p>
          ) : (
            <form className="fb-form" onSubmit={send}>
              <label htmlFor={`fb-note-${slug}`}>{helpful ? "What could we add or explain better? (optional)" : "Anything to add? (optional)"}</label>
              <textarea id={`fb-note-${slug}`} value={note} maxLength={1000} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="Write to the desk…" />
              <div className="fb-form-foot">
                <span>{noteState === "error" ? "That didn’t go through. Try again." : "Please leave out personal details."}</span>
                <button type="submit" disabled={!note.trim() || noteState === "sending"}>{noteState === "sending" ? "Sending…" : "Send"}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
