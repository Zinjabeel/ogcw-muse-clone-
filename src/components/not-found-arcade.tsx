import { ChevronLeft, Gamepad2, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { breakout, dino, GOLD, H, skyhop, snake, W, type Game } from "./arcade-games";
import { T } from "./site-text";

// The arcade in the middle of the 404 page (owner, 15 Oct 2026: "instead of
// the fox ... a multiple choice between 3 games, snake, dinosaur jump and a
// few other games you choose"). A black card: first the four games to pick
// from, each showing its own opening frame; then the game itself, with the
// score, the best score (kept in this browser), restart and back to the games.

const GAMES = [
  { id: "snake", name: "Snake", hint: "Arrow keys or swipe", make: snake },
  { id: "dino", name: "Dino Jump", hint: "Space or tap to jump", make: dino },
  { id: "breakout", name: "Brick Breaker", hint: "Arrow keys or drag", make: breakout },
  { id: "skyhop", name: "Sky Hop", hint: "Space or tap to fly", make: skyhop },
] as const;
type GameDef = (typeof GAMES)[number];
type Phase = "ready" | "playing" | "over";

const START_KEYS = new Set(["Space", "Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"]);
const bestKey = (id: string) => `ogcw-404-best-${id}`;
const readBest = (id: string) => {
  try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch { return 0; }
};
const saveBest = (id: string, score: number) => {
  try { localStorage.setItem(bestKey(id), String(score)); } catch { /* private window: the best just isn't kept */ }
};

/** A crisp canvas at the screen's pixel density, drawn in game units */
function setup(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function Preview({ make }: { make: () => Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) make().draw(setup(ref.current));
  }, [make]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-100" aria-hidden="true" />;
}

export function Arcade() {
  const [def, setDef] = useState<GameDef | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const phaseRef = useRef<Phase>("ready");
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const overAt = useRef(0);

  const toPhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };
  const fresh = (pick: GameDef) => {
    game.current = pick.make();
    scoreRef.current = 0;
    setScore(0);
    setNewBest(false);
    toPhase("ready");
  };
  const choose = (pick: GameDef) => {
    setDef(pick);
    bestRef.current = readBest(pick.id);
    setBest(bestRef.current);
    fresh(pick);
  };
  /** Starts (or restarts after a game over); false while a lost game is still settling */
  const start = () => {
    if (!def) return false;
    if (phaseRef.current === "over") {
      if (performance.now() - overAt.current < 400) return false;
      fresh(def);
    }
    toPhase("playing");
    return true;
  };

  // The loop: move the game on while playing, paint it every frame
  useEffect(() => {
    if (!def || !canvas.current) return;
    const ctx = setup(canvas.current);
    canvas.current.focus({ preventScroll: true });
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const current = game.current;
      if (current) {
        if (phaseRef.current === "playing" && !current.over) {
          current.update(dt);
          if (current.score !== scoreRef.current) {
            scoreRef.current = current.score;
            setScore(current.score);
          }
          if (current.over) {
            overAt.current = now;
            toPhase("over");
            if (current.score > bestRef.current) {
              bestRef.current = current.score;
              setBest(current.score);
              setNewBest(true);
              saveBest(def.id, current.score);
            }
          }
        }
        current.draw(ctx);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [def]);

  const onKey = (event: ReactKeyboardEvent, down: boolean) => {
    if (event.code === "Escape" && down) { setDef(null); return; }
    const current = game.current;
    if (!current) return;
    if (down && phaseRef.current !== "playing") {
      if (!START_KEYS.has(event.code)) return;
      event.preventDefault();
      if (!start()) return;
    }
    if (game.current?.key?.(event.code, down)) event.preventDefault();
  };
  const at = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * W, ((event.clientY - rect.top) / rect.height) * H] as const;
  };
  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (phaseRef.current !== "playing" && !start()) return;
    game.current?.down?.(...at(event));
  };

  return (
    <section aria-label="Play a game" className="rounded-[28px] bg-[#0d0d0d] p-2.5 text-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.6)]" style={{ width: "min(100%, 660px, calc((100dvh - 340px) * 1.5))" }}>
      <header className="flex h-10 items-center justify-between gap-3 px-2 pb-2.5">
        {def ? (
          <>
            <button type="button" onClick={() => setDef(null)} className="inline-flex items-center gap-1 rounded-full bg-white/10 py-1.5 pl-2 pr-3.5 text-xs font-extrabold uppercase tracking-[0.1em] transition-colors hover:bg-white hover:text-black">
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> <T k="404.games.back">Games</T>
            </button>
            <p className="truncate text-sm font-black uppercase tracking-[0.08em] sm:text-base">{def.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/60 tabular-nums" aria-live="polite">
                <span className="text-white">{score}</span><span className="hidden sm:inline"> · <T k="404.games.best">Best</T> <span style={{ color: GOLD }}>{best}</span></span>
              </p>
              <button type="button" onClick={() => { fresh(def); canvas.current?.focus({ preventScroll: true }); }} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white hover:text-black" aria-label="Restart">
                <RotateCcw className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] sm:text-sm">
              <span style={{ color: GOLD }}><T k="404.games.lost">Lost?</T></span> <T k="404.games.pick">Pick a game</T>
            </p>
            <Gamepad2 className="h-5 w-5" style={{ color: GOLD }} strokeWidth={2.25} aria-hidden="true" />
          </>
        )}
      </header>

      <div className="relative aspect-[3/2] overflow-hidden rounded-[20px] bg-[#141414]">
        {def ? (
          <>
            <canvas
              ref={canvas}
              tabIndex={0}
              aria-label={`${def.name}. ${def.hint}. Escape goes back to the games.`}
              className="block h-full w-full touch-none outline-none"
              onKeyDown={(event) => onKey(event, true)}
              onKeyUp={(event) => onKey(event, false)}
              onPointerDown={onDown}
              onPointerMove={(event) => game.current?.move?.(...at(event))}
              onPointerUp={(event) => game.current?.up?.(...at(event))}
            />
            {phase !== "playing" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 px-4 text-center">
                {phase === "ready" ? (
                  <>
                    <p className="text-2xl font-black uppercase tracking-tight sm:text-4xl">{def.name}</p>
                    <p className="text-xs font-semibold text-white/70 sm:text-sm">{def.hint}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black uppercase tracking-tight sm:text-4xl" style={{ color: GOLD }}><T k="404.games.over">Game over</T></p>
                    <p className="text-sm font-bold text-white/80 sm:text-base">{newBest ? <T k="404.games.newbest">New best:</T> : <T k="404.games.score">Score:</T>} {score}</p>
                  </>
                )}
                <p className="mt-2 rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-black sm:text-xs" style={{ background: GOLD }}>
                  {phase === "ready" ? <T k="404.games.start">Press space or tap to start</T> : <T k="404.games.again">Space or tap to play again</T>}
                </p>
              </div>
            )}
          </>
        ) : (
          <ul className="grid h-full grid-cols-2 grid-rows-2 gap-2 p-2">
            {GAMES.map((pick) => (
              <li key={pick.id} className="min-h-0">
                <button
                  type="button"
                  onClick={() => choose(pick)}
                  className="group relative block h-full w-full overflow-hidden rounded-2xl bg-[#0d0d0d] text-left ring-1 ring-white/10 transition hover:ring-2 hover:ring-[#F4B921] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B921]"
                >
                  <Preview make={pick.make} />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" aria-hidden="true" />
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-black transition-transform group-hover:scale-110 sm:h-8 sm:w-8" style={{ background: GOLD }} aria-hidden="true">
                    <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" strokeWidth={0} />
                  </span>
                  <span className="absolute bottom-2 left-2.5 right-2.5 sm:bottom-3 sm:left-3.5">
                    <span className="block text-sm font-black uppercase leading-tight tracking-tight sm:text-xl">{pick.name}</span>
                    <span className="hidden text-[11px] font-semibold text-white/60 sm:block">{pick.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
