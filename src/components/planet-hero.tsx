import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { LIVE, SECTIONS, formatDate, getArticle, type Photo } from "../data/content";

// The shop home's hero (owner's brief, 13 Oct 2026), built on the "Planet
// jumping" design: after the OGCW intro the approach to Earth plays for about
// three seconds with a thin 0-100% count and stops on the whole planet. A
// rounded window in the middle (a canvas, tilting toward the pointer) looks
// down on it. Click it and you dive through the clouds to a random place
// OGCW has covered (a stadium, a concert, a convention in California...),
// whose name and story come in where a planet's facts would be. Each click
// after that jumps to the next place, and after the last one the window
// goes back up to Earth and the order is shuffled again.
// Everything is measured against the hero itself (not the window), so it
// works inside the scrolling page and the site's 0.9 zoom. The approach
// plays once per tab; after that, and with reduced motion, the hero opens
// on Earth straight away.

const TO_EARTH = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4";
// Moments in the Earth footage, as shares of its length
const AT_EARTH = 0.3; // the whole planet in space: where the approach stops
const AT_NEAR = 0.42; // closer in: what the window shows
const AT_GROUND = 0.62; // through the clouds, just above the ground

const KEY = "ogcw-planet-intro-seen";
const EARTH_FACTS: [string, string][] = [
  ["Distance:", "149.6 million km from the Sun."],
  ["Year:", "365.25 Earth days."],
  ["Temperature:", "Average surface temperature around 15 °C."],
  ["Atmosphere:", "Mostly nitrogen and oxygen, supporting life and liquid water."],
];

type Place = { key: string; name: string; where: string; photo: Photo; href: string; headline: string; deck: string; filed: string };
const fromStory = (key: string, name: string, where: string, slug: string): Place[] => {
  const story = getArticle(slug);
  return story ? [{ key, name, where, photo: story.photo, href: `/news/${story.slug}`, headline: story.title, deck: story.deck, filed: `${formatDate(story.date)} · ${SECTIONS[story.section].label}` }] : [];
};
// Places from OGCW's own stories, each one where its photo was taken
const PLACES: Place[] = [
  ...fromStory("london", "London", "Wembley Stadium, London, during the Eras Tour", "taylor-swift-the-life-of-a-showgirl-the-encore"),
  { key: "paris", name: "Paris", where: "Stade de France, Paris", photo: LIVE.photo, href: "/tour/bts-arirang", headline: LIVE.title, deck: "Two nights at the Stade de France in Paris drew 185,000 people.", filed: LIVE.kicker },
  ...fromStory("anaheim", "Anaheim", "Anaheim Convention Center, California", "blizzcon-2026-diablo-v-starcraft"),
  ...fromStory("hollywood", "Hollywood", "The Hollywood Walk of Fame, Los Angeles", "keffe-d-guilty-tupac-shakur-murder"),
  ...fromStory("makuhari", "Makuhari", "Makuhari Messe, Chiba, Japan", "tokyo-game-show-2026-typhoon"),
  ...fromStory("venice", "Venice", "The Palazzo del Cinema, Venice", "venice-2026-woman-unknown-golden-lion"),
];
type Stop = { kind: "earth" } | { kind: "place"; place: Place };
const shuffle = <T,>(items: T[]) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};
const posOf = (photo: Photo): [number, number] => {
  const [x = 50, y = 50] = (photo.crop?.pos ?? "50% 50%").split(" ").map((part) => parseFloat(part));
  return [x / 100, y / 100];
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
type Media = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
type Paint = { media: Media; zoom?: number; pos?: [number, number]; dim?: number };
const DIM = 0.26; // place photos are darkened a little, so the white type reads on a bright sky
const sizeOf = (media: Media) =>
  media instanceof HTMLVideoElement ? [media.videoWidth, media.videoHeight] : media instanceof HTMLImageElement ? [media.naturalWidth, media.naturalHeight] : [media.width, media.height];

export function PlanetHero() {
  const root = useRef<HTMLElement>(null);
  const router = useRouter();
  const go = useRef((href: string) => router.history.push(href));
  go.current = (href: string) => router.history.push(href);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const $ = <T extends Element>(selector: string) => el.querySelector<T>(selector)!;
    const preloader = $<HTMLDivElement>(".pj-preloader");
    const earth = $<HTMLVideoElement>(".pj-preloader video");
    const count = $<HTMLDivElement>(".pj-count");
    const countValue = $<HTMLSpanElement>(".pj-count-value");
    const canvas = $<HTMLCanvasElement>(".pj-portal-canvas");
    const list = $<HTMLElement>(".pj-list");
    const portal = $<HTMLButtonElement>(".pj-portal");
    const nextNumber = $<HTMLSpanElement>(".pj-next-number");
    const nextName = $<HTMLElement>(".pj-next-name");
    const content = $<HTMLDivElement>(".pj-content");
    const title = $<HTMLHeadingElement>(".pj-title");
    const facts = $<HTMLDListElement>(".pj-facts");
    const cursor = $<HTMLDivElement>(".pj-cursor");
    const ctx = canvas.getContext("2d");
    // A still of the whole planet, taken where the approach stops
    const still = document.createElement("canvas");
    const sctx = still.getContext("2d");
    if (!ctx || !sctx) return;
    earth.muted = true;
    const photos = Object.fromEntries(PLACES.map((place) => {
      const img = new Image();
      img.decoding = "async";
      img.src = place.photo.src;
      return [place.key, img];
    }));

    let alive = true;
    let visible = true;
    let route: Stop[] = [{ kind: "earth" }, ...shuffle(PLACES).map((place): Stop => ({ kind: "place", place }))];
    let at = 0;
    let firstRender = true;
    let busy = false;
    let rotX = 0, rotY = 0, targetX = 0, targetY = 0;
    let expansion = 0, maskScale = 0;
    let travelPaint: ((context: CanvasRenderingContext2D) => void) | null = null;
    let backdrop: Paint | null = null;
    let W = 0, H = 0, radius = 90;
    let frame = 0, last = performance.now();
    let cx = 0, cy = 0, px = 0, py = 0, cursorOn = false;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => { timers.push(window.setTimeout(() => { if (alive) fn(); }, ms)); };
    const frames = (n: number) => new Promise<void>((resolve) => { const step = () => (--n <= 0 ? resolve() : requestAnimationFrame(step)); requestAnimationFrame(step); });
    /** The hero's box on screen and the zoom it sits under (screen px per hero px) */
    const box = () => { const rect = el.getBoundingClientRect(); return { rect, k: rect.width / (el.offsetWidth || 1) || 1 }; };
    /** Resolves on the first of `events`, or after `ms` */
    const once = (target: EventTarget, events: string[], ms: number) =>
      new Promise<void>((resolve) => {
        const done = () => { events.forEach((name) => target.removeEventListener(name, done)); window.clearTimeout(timer); resolve(); };
        events.forEach((name) => target.addEventListener(name, done, { once: true }));
        const timer = window.setTimeout(done, ms);
      });
    const seek = (share: number) => {
      if (!earth.duration) return Promise.resolve();
      earth.pause();
      const wait = once(earth, ["seeked", "error"], 3000);
      earth.currentTime = earth.duration * share;
      return wait;
    };
    const retrigger = (target: Element, cls: string) => { target.classList.remove(cls); void (target as HTMLElement).offsetWidth; target.classList.add(cls); };
    const animateValue = (set: (v: number) => void, ms: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const step = (now: number) => {
          if (!alive) return resolve();
          const t = Math.min(1, (now - start) / ms);
          set(ease(t));
          if (t < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
      });

    /* ---------- Canvas ---------- */
    const resizeCanvas = () => {
      W = el.offsetWidth;
      H = el.offsetHeight;
      radius = parseFloat(getComputedStyle(portal).borderTopLeftRadius) || 90;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      fitTitle();
    };
    /** Media drawn to cover the hero, screen-locked; `zoom` pushes in on `pos` */
    const drawCover = (context: CanvasRenderingContext2D, { media, zoom = 1, pos = [0.5, 0.5], dim = 0 }: Paint) => {
      if (media instanceof HTMLVideoElement && media.readyState < 2) return;
      if (media instanceof HTMLImageElement && !media.complete) return;
      const [mw = 0, mh = 0] = sizeOf(media);
      if (!mw || !mh) return;
      const scale = Math.max(W / mw, H / mh) * zoom;
      const w = mw * scale, h = mh * scale;
      context.drawImage(media, (W - w) * pos[0], (H - h) * pos[1], w, h);
      if (dim) { context.fillStyle = `rgba(0,0,0,${dim})`; context.fillRect(0, 0, W, H); }
    };
    const drawShade = (context: CanvasRenderingContext2D) => {
      const gradient = context.createLinearGradient(0, H * 0.52, 0, H);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,.88)");
      context.fillStyle = gradient;
      context.fillRect(0, H * 0.52, W, H * 0.48);
    };
    /** ~44 points round a w x h rectangle with corners of radius r, centred on 0,0 */
    const roundedRect = (w: number, h: number, r: number) => {
      r = Math.min(r, w / 2, h / 2);
      const points: [number, number][] = [];
      const corners = [
        [w / 2 - r, -h / 2 + r, -Math.PI / 2, 0],
        [w / 2 - r, h / 2 - r, 0, Math.PI / 2],
        [-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI],
        [-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5],
      ] as const;
      for (const [x, y, a0, a1] of corners) {
        for (let i = 0; i <= 10; i++) {
          const a = a0 + ((a1 - a0) * i) / 10;
          points.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
        }
      }
      return points;
    };
    /** A fake perspective, focal length 850 */
    const project = (x: number, y: number, rx: number, ry: number, ox: number, oy: number): [number, number] => {
      const ax = (rx * Math.PI) / 180, ay = (ry * Math.PI) / 180;
      const xx = x * Math.cos(ay), yy = y * Math.cos(ax);
      const z = x * Math.sin(ay) - y * Math.sin(ax);
      const p = 850 / (850 + z);
      return [ox + xx * p, oy + yy * p];
    };
    /** What the window shows while it waits: the way down, or the next place */
    const windowPaint = (): Paint => {
      const stop = route[at]!;
      const next = route[(at + 1) % route.length]!;
      if (stop.kind === "earth") return { media: earth };
      if (next.kind === "earth") return { media: still, zoom: 1.12 };
      return { media: photos[next.place.key]!, zoom: 1.12, pos: posOf(next.place.photo) };
    };
    const draw = (now: number) => {
      if (!alive) return;
      frame = requestAnimationFrame(draw);
      const dt = Math.min(40, now - last);
      last = now;
      rotX += (targetX - rotX) * Math.min(1, dt * 0.009);
      rotY += (targetY - rotY) * Math.min(1, dt * 0.009);
      if (cursorOn) {
        cx += (px - cx) * 0.2;
        cy += (py - cy) * 0.2;
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      if (backdrop) { drawCover(ctx, backdrop); drawShade(ctx); }
      const { rect: hero, k } = box();
      const rect = portal.getBoundingClientRect();
      const rw = rect.width / k, rh = rect.height / k;
      const rcx = (rect.left - hero.left) / k + rw / 2, rcy = (rect.top - hero.top) / k + rh / 2;
      const e = expansion;
      const ox = rcx + (W / 2 - rcx) * e, oy = rcy + (H / 2 - rcy) * e;
      const scale = e ? 1 : maskScale;
      const w = (rw + (W - rw) * e) * scale, h = (rh + (H - rh) * e) * scale;
      const r = radius * (1 - e) * scale, rx = rotX * (1 - e), ry = rotY * (1 - e);
      if (w <= 1 || h <= 1) return;
      const points = roundedRect(w, h, r).map(([x, y]) => project(x, y, rx, ry, ox, oy));
      ctx.save();
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "#030303";
      ctx.fillRect(0, 0, W, H);
      if (travelPaint) { travelPaint(ctx); drawShade(ctx); } else drawCover(ctx, windowPaint());
      ctx.restore();
    };

    /* ---------- The page for the current stop ---------- */
    const row = (key: string, value: string | Node) => {
      const item = document.createElement("div");
      item.className = "pj-fact";
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      dd.append(value);
      item.append(dt, dd);
      return item;
    };
    /** The name as big as it can be, as long as it fits beside the facts */
    function fitTitle() {
      title.style.fontSize = "";
      const stacked = getComputedStyle(content).display === "block";
      const room = content.clientWidth - (stacked ? 0 : facts.offsetWidth + (parseFloat(getComputedStyle(content).columnGap) || 40));
      const wide = title.scrollWidth;
      if (room > 0 && wide > room) title.style.fontSize = `${(parseFloat(getComputedStyle(title).fontSize) * room) / wide}px`;
    }
    const render = () => {
      const stop = route[at]!;
      const nextAt = (at + 1) % route.length;
      const next = route[nextAt]!;
      el.dataset["stop"] = stop.kind === "earth" ? "earth" : stop.place.key;
      title.textContent = (stop.kind === "earth" ? "Earth" : stop.place.name).toUpperCase();
      const name = next.kind === "earth" ? "Earth" : stop.kind === "earth" ? "Somewhere on Earth" : next.place.name;
      nextName.textContent = name;
      nextNumber.textContent = stop.kind === "earth" ? "[??]" : `[${String(nextAt).padStart(2, "0")}]`;
      portal.setAttribute("aria-label", stop.kind === "earth" ? "Travel to a random place on Earth" : `Travel to ${name}`);
      if (stop.kind === "earth") facts.replaceChildren(...EARTH_FACTS.map(([key, value]) => row(key, value)));
      else {
        const { place } = stop;
        const link = document.createElement("a");
        link.href = place.href;
        link.className = "pj-story";
        link.textContent = place.headline;
        facts.replaceChildren(row("Where:", place.where), row("Story:", link), row("In short:", place.deck), row("Filed:", place.filed));
      }
      list.replaceChildren(...route.map((item, i) => {
        const span = document.createElement("span");
        span.className = i === at ? "pj-item is-active" : "pj-item";
        span.textContent = item.kind === "earth" ? "Earth" : item.place.name;
        return span;
      }));
      if (!firstRender) retrigger(list, "is-switching");
      firstRender = false;
      fitTitle();
    };
    const revealMask = () => { retrigger(el, "mask-revealing"); maskScale = 0; return animateValue((v) => { maskScale = v; }, 1050); };
    const revealPlanetContent = () => retrigger(el, "content-revealing");

    /* ---------- Going to the next stop ---------- */
    const travel = async () => {
      if (busy || !el.classList.contains("intro-ready")) return;
      busy = true;
      targetX = targetY = 0;
      const from = route[at]!;
      const nextAt = (at + 1) % route.length;
      const to = route[nextAt]!;
      try {
        el.classList.remove("content-revealing", "mask-revealing");
        el.classList.add("is-transitioning");
        if (from.kind === "earth" && to.kind === "place") {
          // Down through the clouds, then the place comes up out of the ground
          const photo: Paint = { media: photos[to.place.key]!, pos: posOf(to.place.photo), dim: DIM };
          let fade = 0;
          travelPaint = (context) => {
            drawCover(context, { media: earth });
            if (!fade) return;
            context.globalAlpha = fade;
            drawCover(context, { ...photo, zoom: 1.14 - 0.14 * fade });
            context.globalAlpha = 1;
          };
          const ground = earth.duration * AT_GROUND;
          earth.playbackRate = 1.3;
          await earth.play();
          const landed = new Promise<void>((resolve) => {
            const watch = () => {
              if (!alive || earth.paused || earth.ended || earth.currentTime >= ground) { earth.pause(); return resolve(); }
              requestAnimationFrame(watch);
            };
            requestAnimationFrame(watch);
          });
          await animateValue((v) => { expansion = v; }, 1100);
          await Promise.race([landed, new Promise<void>((resolve) => later(4000, resolve))]);
          await animateValue((v) => { fade = v; }, 900);
          backdrop = photo;
        } else {
          // Into the next place (or back up to Earth): the window opens over it while it settles
          const target: Paint = to.kind === "place" ? { media: photos[to.place.key]!, pos: posOf(to.place.photo), dim: DIM } : { media: still };
          travelPaint = (context) => drawCover(context, { ...target, zoom: 1.12 - 0.12 * expansion, dim: (target.dim ?? 0) * expansion });
          await animateValue((v) => { expansion = v; }, 1300);
          backdrop = target;
        }
        if (to.kind === "earth") { route = [to, ...shuffle(PLACES).map((place): Stop => ({ kind: "place", place }))]; at = 0; }
        else at = nextAt;
        el.classList.add("is-committing");
        render();
        await frames(2);
        travelPaint = null;
        expansion = 0;
        maskScale = 0;
        el.classList.remove("is-transitioning", "is-committing");
        if (from.kind === "earth" || to.kind === "earth") await seek(AT_NEAR); // the window looks down on Earth again
        const reveal = revealMask();
        later(100, revealPlanetContent);
        await reveal;
        later(450, () => { busy = false; });
      } catch {
        travelPaint = null;
        expansion = 0;
        maskScale = 1;
        el.classList.remove("is-transitioning", "is-committing");
        busy = false;
      }
    };

    /* ---------- The approach to Earth ---------- */
    const startExperience = async () => {
      // Keep the whole planet as the backdrop, then turn the footage on to the window's view
      if (earth.readyState >= 2 && earth.videoWidth) {
        still.width = earth.videoWidth;
        still.height = earth.videoHeight;
        sctx.drawImage(earth, 0, 0);
        backdrop = { media: still };
      }
      await seek(AT_NEAR);
      if (!alive) return;
      await revealMask();
      if (!alive) return;
      el.classList.add("intro-ready");
      later(850, revealPlanetContent);
    };
    const runPreloader = () => {
      let seen = false;
      try { seen = !!sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, "1"); } catch { /* storage blocked: it plays every time */ }
      const quick = seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let done = false;
      let tick = 0;
      const finish = () => {
        if (done || !alive) return;
        done = true;
        cancelAnimationFrame(tick);
        earth.pause();
        countValue.textContent = "100";
        count.classList.add("is-leaving");
        preloader.classList.add("is-background");
        el.classList.add("preload-complete");
        void startExperience();
        later(750, () => { count.hidden = true; });
      };
      const whenReady = (fn: () => void) => (earth.readyState >= 1 ? fn() : earth.addEventListener("loadedmetadata", fn, { once: true }));
      const straightThere = () => whenReady(() => { void seek(AT_EARTH).then(finish); });
      earth.addEventListener("error", finish, { once: true });
      if (quick) {
        count.hidden = true;
        straightThere();
        later(4000, finish);
        return;
      }
      el.classList.add("is-preloading");
      whenReady(() => {
        const stop = earth.duration * AT_EARTH;
        earth.playbackRate = Math.max(0.25, stop / 3); // about three seconds
        earth.play().catch(() => { count.hidden = true; straightThere(); });
        const update = () => {
          if (done || !alive) return;
          countValue.textContent = String(Math.min(100, Math.round((earth.currentTime / stop) * 100)));
          if (earth.currentTime >= stop) return finish();
          tick = requestAnimationFrame(update);
        };
        tick = requestAnimationFrame(update);
      });
      later(15000, finish); // a very slow connection still gets the hero
    };

    /* ---------- Pointer: the tilt, the cursor and the story links ---------- */
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const { rect, k } = box();
      px = (event.clientX - rect.left) / k;
      py = (event.clientY - rect.top) / k;
      if (!cursorOn) { cx = px; cy = py; cursorOn = true; cursor.classList.add("is-visible"); }
      if (!busy) {
        targetY = (px / (W || 1) - 0.5) * 37.4;
        targetX = (py / (H || 1) - 0.5) * -33;
      }
    };
    const onLeave = () => { targetX = targetY = 0; cursorOn = false; cursor.classList.remove("is-visible"); };
    const onEnter = () => cursor.classList.add("is-enter");
    const onExit = () => cursor.classList.remove("is-enter");
    const onClick = () => { void travel(); };
    const onStory = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a.pj-story");
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      go.current(link.getAttribute("href") ?? "/");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    portal.addEventListener("pointerenter", onEnter);
    portal.addEventListener("pointerleave", onExit);
    portal.addEventListener("click", onClick);
    facts.addEventListener("click", onStory);
    const resize = new ResizeObserver(() => resizeCanvas());
    resize.observe(el);
    const seen = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; });
    seen.observe(el);
    void document.fonts?.ready.then(() => { if (alive) fitTitle(); });

    /* ---------- Boot ---------- */
    resizeCanvas();
    render();
    frame = requestAnimationFrame(draw);
    // Wait for the OGCW intro (if it is playing) to clear first
    const html = document.documentElement;
    let waiting: MutationObserver | undefined;
    if (html.hasAttribute("data-entry")) {
      waiting = new MutationObserver(() => { if (!html.hasAttribute("data-entry")) { waiting?.disconnect(); runPreloader(); } });
      waiting.observe(html, { attributes: true, attributeFilter: ["data-entry"] });
    } else runPreloader();

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      waiting?.disconnect();
      resize.disconnect();
      seen.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      portal.removeEventListener("pointerenter", onEnter);
      portal.removeEventListener("pointerleave", onExit);
      portal.removeEventListener("click", onClick);
      facts.removeEventListener("click", onStory);
      earth.pause();
    };
  }, []);

  return (
    <section className="pj" ref={root} aria-label="Earth, and the places OGCW has covered">
      <div className="pj-preloader" aria-label="Loading Earth">
        <video src={TO_EARTH} muted playsInline preload="auto" />
        <div className="pj-preloader-shade" />
      </div>
      <div className="pj-count" aria-live="polite">
        <span className="pj-count-value">0</span><span className="pj-percent">%</span>
      </div>
      <div className="pj-shade" aria-hidden="true" />

      <aside className="pj-list pj-chrome" aria-label="Places" />

      <canvas className="pj-portal-canvas" aria-hidden="true" />
      <div className="pj-portal-wrap pj-chrome" role="group" aria-label="Next destination">
        <div className="pj-portal-heading">
          <span>Next:</span>
          <span><span className="pj-next-number">[??]</span> <strong className="pj-next-name">Somewhere on Earth</strong></span>
        </div>
        <button className="pj-portal" type="button" aria-label="Travel to a random place on Earth" />
      </div>

      <div className="pj-content pj-chrome" aria-live="polite">
        <h1 className="pj-title">EARTH</h1>
        <dl className="pj-facts" />
      </div>

      <div className="pj-loading" aria-hidden="true">Preparing orbit…</div>
      <div className="pj-cursor" aria-hidden="true">
        <span className="pj-cursor-orbit" /><span className="pj-cursor-dot" /><span className="pj-cursor-label">Enter</span>
      </div>
    </section>
  );
}
