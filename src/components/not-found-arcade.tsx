import { ChevronLeft, ChevronRight, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { storePreference } from "@/lib/consent";
import { GAMES, H, W, YELLOW, type Game } from "./arcade-games";
import { T } from "./site-text";

// The arcade in the middle of the 404 page (owner, 15 Oct 2026). One game at
// a time in a see-through glass card; the others wait on either side, turned
// away in 3D, and come round with the arrows, a scroll, a swipe, the left and
// right keys, the dots or a click. The games themselves are in
// src/components/arcade-games.ts. Best scores are kept in this browser.

type Phase = "ready" | "playing" | "over";
const N = GAMES.length;
const wrap = (i: number) => ((i % N) + N) % N;

const bestKey = (id: string) => `ogcw-404-best-${id}`;
const readBest = (id: string) => {
  try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch { return 0; }
};
// Kept only if the reader allows preferences (the cookie settings)
const saveBest = (id: string, score: number) => storePreference(bestKey(id), String(score));

/** A crisp canvas at the screen's pixel density, drawn in game units */
function setup(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Gold letters with a stack of darker golds under them, so they stand out in 3D
const EXTRUDE = "0 1px 0 #E6CF00, 0 2px 0 #CCB400, 0 3px 0 #B39A00, 0 4px 0 #9C7F02, 0 5px 0 #846603, 0 12px 22px rgba(0,0,0,0.65)";
// The card: a sheet of dark glass with a lit top edge
const GLASS = "0 50px 100px -30px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.05)";
// Card height = its header (52px) + a 3:2 screen + its padding; it never
// runs taller than the room between the nav and the way home
const SIZE = "min(100%, 600px, calc((100dvh - 372px) * 1.5))";

function screenStyle(tilt: number) {
  return { transform: tilt ? `rotateX(${tilt}deg) scale(0.9)` : undefined, transformOrigin: "50% 58%" };
}

function Preview({ index }: { index: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) GAMES[index]!.make().draw(setup(ref.current), 0);
  }, [index]);
  return <canvas ref={ref} className="block h-full w-full" style={screenStyle(GAMES[index]!.tilt)} aria-hidden="true" />;
}

export function Arcade({ paused = false }: { paused?: boolean }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const phaseRef = useRef<Phase>("ready");
  const indexRef = useRef(0);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const overAt = useRef(0);
  const switchedAt = useRef(0);
  const wheel = useRef({ sum: 0, at: 0 });
  const press = useRef<{ x: number; y: number } | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const def = GAMES[index]!;

  const toPhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };
  const fresh = () => {
    game.current = GAMES[indexRef.current]!.make();
    scoreRef.current = 0;
    setScore(0);
    setNewBest(false);
    toPhase("ready");
  };
  /** Starts, or plays again once a lost game has settled; false while it settles */
  const start = () => {
    if (phaseRef.current === "playing") return true;
    if (phaseRef.current === "over") {
      if (performance.now() - overAt.current < 400) return false;
      fresh();
    }
    toPhase("playing");
    return true;
  };
  const go = (step: number) => {
    if (phaseRef.current === "playing" || !step) return;
    const now = performance.now();
    if (now - switchedAt.current < 380) return;
    switchedAt.current = now;
    setIndex((i) => wrap(i + step));
  };

  // A fresh game whenever another one comes round
  useEffect(() => {
    indexRef.current = index;
    bestRef.current = readBest(GAMES[index]!.id);
    setBest(bestRef.current);
    fresh();
  }, [index]);

  // The loop: move the game on while it's played, run its effects and paint it
  useEffect(() => {
    if (!canvas.current) return;
    const ctx = setup(canvas.current);
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const current = game.current;
      if (current) {
        if (phaseRef.current === "playing" && !current.over && !pausedRef.current) {
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
              saveBest(GAMES[indexRef.current]!.id, current.score);
            }
          }
        }
        current.ambient(dt);
        current.shake = Math.max(0, current.shake - dt * 1.6);
        ctx.save();
        if (current.shake > 0) {
          const amount = current.shake * 12;
          ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
        }
        current.draw(ctx, now / 1000);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [index]);

  // Keys: left and right change the game until it starts; then they're the game's
  useEffect(() => {
    const handle = (event: KeyboardEvent, down: boolean) => {
      if (pausedRef.current) return;
      const target = event.target;
      if ((event.code === "Space" || event.code === "Enter") && target instanceof Element && target.closest("a, button, input, textarea, select")) return;
      if (phaseRef.current !== "playing") {
        if (!down) { game.current?.key?.(event.code, false); return; }
        if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
          event.preventDefault();
          go(event.code === "ArrowLeft" ? -1 : 1);
        } else if (["Space", "Enter", "ArrowUp", "KeyW"].includes(event.code)) {
          event.preventDefault();
          if (start()) game.current?.key?.(event.code, true);
        }
        return;
      }
      if (event.code === "Escape" && down) { fresh(); return; }
      if (game.current?.key?.(event.code, down)) event.preventDefault();
    };
    const keydown = (event: KeyboardEvent) => handle(event, true);
    const keyup = (event: KeyboardEvent) => handle(event, false);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, []);

  const onWheel = (event: ReactWheelEvent) => {
    if (phaseRef.current === "playing") return;
    const now = performance.now();
    if (now - wheel.current.at > 220) wheel.current.sum = 0;
    wheel.current.at = now;
    wheel.current.sum += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(wheel.current.sum) > 40) {
      go(Math.sign(wheel.current.sum));
      wheel.current.sum = 0;
    }
  };
  const at = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * W, ((event.clientY - rect.top) / rect.height) * H] as const;
  };
  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { x: event.clientX, y: event.clientY };
    if (phaseRef.current === "playing") game.current?.down?.(...at(event));
  };
  // Before a game: a sideways swipe changes the game, a tap starts it
  const onUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const from = press.current;
    press.current = null;
    if (phaseRef.current === "playing") { game.current?.up?.(...at(event)); return; }
    if (!from) return;
    const dx = event.clientX - from.x;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(event.clientY - from.y)) go(dx < 0 ? 1 : -1);
    else if (start()) game.current?.down?.(...at(event));
  };
  const play = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    start();
  };

  const playing = phase === "playing";
  const arrow = "absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition hover:scale-110 hover:border-transparent hover:bg-[#FFE600] hover:text-black disabled:pointer-events-none disabled:opacity-25 sm:h-14 sm:w-14";

  return (
    <section aria-label="Play a game" aria-roledescription="carousel" className="flex w-full flex-col items-center">
      <div className="relative" style={{ width: SIZE, perspective: "1600px" }} onWheel={onWheel}>
        {/* Sizes the stage like one card: its header and its 3:2 screen */}
        <div className="invisible p-2.5 pt-0" aria-hidden="true">
          <div className="h-[52px]" />
          <div className="aspect-[3/2]" />
        </div>

        {GAMES.map((item, i) => {
          const off = ((i - index + N + 1) % N) - 1; // -1 left, 0 in front, 1 right, 2 behind
          const front = off === 0;
          const transform = front
            ? "translate3d(0, 0, 0) rotateY(0deg)"
            : off === 2
              ? "translate3d(0, 0, -420px) scale(0.7)"
              : `translate3d(${off * 76}%, 0, -220px) rotateY(${off * -44}deg)`;
          return (
            <article
              key={item.id}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${N}: ${item.name}`}
              aria-hidden={!front}
              className="absolute inset-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform, opacity: front ? 1 : off === 2 ? 0 : 0.45, zIndex: front ? 3 : off === 2 ? 0 : 1, pointerEvents: off === 2 ? "none" : undefined }}
            >
              <div className="flex h-full flex-col rounded-[26px] border border-white/15 bg-white/[0.05] p-2.5 pt-0 backdrop-blur-xl" style={{ boxShadow: GLASS }}>
                <header className="flex h-[52px] items-center gap-3 px-2">
                  <span className="text-xs font-black tabular-nums" style={{ color: YELLOW }}>
                    {String(i + 1).padStart(2, "0")}<span className="text-white/35"> / {String(N).padStart(2, "0")}</span>
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-black uppercase tracking-[0.12em] text-white sm:text-base">{item.name}</p>
                  {front && (
                    <>
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/50 tabular-nums" aria-live="polite">
                        <span className="text-sm font-black text-white">{score}</span>
                        <span className="hidden sm:inline"> · <T k="404.games.best">Best</T> <span style={{ color: YELLOW }}>{best}</span></span>
                      </p>
                      <button
                        type="button"
                        onClick={() => { (document.activeElement as HTMLElement | null)?.blur(); fresh(); }}
                        className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-black"
                        aria-label="Restart"
                      >
                        <RotateCcw className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </header>
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-[18px] bg-black/10 ring-1 ring-white/10" style={{ perspective: "760px" }}>
                  {front ? (
                    <canvas
                      ref={canvas}
                      aria-label={`${item.name}: ${item.hint}`}
                      className="block h-full w-full touch-none select-none"
                      style={screenStyle(item.tilt)}
                      onPointerDown={onDown}
                      onPointerMove={(event) => { if (phaseRef.current === "playing") game.current?.move?.(...at(event)); }}
                      onPointerUp={onUp}
                      onPointerCancel={() => { press.current = null; }}
                    />
                  ) : (
                    <Preview index={i} />
                  )}
                  {front && !playing && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 px-5 text-center">
                      {phase === "ready" ? (
                        <>
                          <p className="text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl" style={{ color: YELLOW, textShadow: EXTRUDE }}>{def.name}</p>
                          <p className="mt-1 hidden max-w-[36ch] text-sm font-semibold text-white/80 sm:block">{def.tagline}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl" style={{ color: YELLOW, textShadow: EXTRUDE }}><T k="404.games.over">Game over</T></p>
                          <p className="mt-1 text-sm font-bold text-white sm:text-base">{newBest ? <T k="404.games.newbest">New best:</T> : <T k="404.games.score">Score:</T>} {score}</p>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={play}
                        className="pointer-events-auto mt-2 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-black shadow-[0_6px_0_#9C7F02,0_16px_26px_-6px_rgba(0,0,0,0.75)] transition hover:-translate-y-0.5 active:translate-y-[4px] active:shadow-[0_2px_0_#9C7F02] sm:text-sm"
                        style={{ background: YELLOW }}
                      >
                        <Play className="h-4 w-4" fill="currentColor" strokeWidth={0} aria-hidden="true" />
                        {phase === "ready" ? <T k="404.games.play">Play</T> : <T k="404.games.again">Play again</T>}
                      </button>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 sm:text-[11px]">{def.hint}</p>
                    </div>
                  )}
                </div>
              </div>
              {!front && off !== 2 && (
                <button type="button" onClick={() => go(off)} className="absolute inset-0 rounded-[26px]" aria-label={`Show ${item.name}`} tabIndex={-1} />
              )}
            </article>
          );
        })}

        <button type="button" onClick={() => go(-1)} disabled={playing} className={`${arrow} left-1 sm:-left-7`} aria-label="Previous game">
          <ChevronLeft className="h-6 w-6" strokeWidth={2.75} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(1)} disabled={playing} className={`${arrow} right-1 sm:-right-7`} aria-label="Next game">
          <ChevronRight className="h-6 w-6" strokeWidth={2.75} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {GAMES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(i - index)}
              disabled={playing}
              aria-label={`Show ${item.name}`}
              aria-current={i === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-500 disabled:cursor-default ${i === index ? "w-8" : "w-2 bg-white/30 hover:bg-white/60"}`}
              style={i === index ? { background: YELLOW } : undefined}
            />
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 sm:text-[11px]"><T k="404.games.more">Scroll, swipe or use the arrows</T></p>
      </div>
    </section>
  );
}
