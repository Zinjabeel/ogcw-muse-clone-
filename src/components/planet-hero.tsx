import { useRouter } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SHOP_CATEGORIES, brandOf, fullName, getProduct, retailerOf, type ShopProduct } from "../data/shop";

// The shop home's hero: a short film that plays by itself (owner's brief,
// 13 Oct 2026; the look is the "Planet jumping" design). After the OGCW
// intro the approach to Earth plays with a thin 0-100% count and holds on
// the whole planet with its name and facts. Then it dives through the clouds
// and comes out in the shop: the street, the sneaker aisle, the Nike x One
// Piece pack, each of the three pairs, clothing, watches and chains. Every
// scene has the same big name, with the facts column pointing at the real
// shop page. After the last one it pulls back out to Earth and goes round
// again. Nothing needs a click; the film waits while the hero is off screen
// or the tab is hidden, and there is a pause button by the scene list. With
// reduced motion the scenes simply cross-fade.
// Everything is drawn on one canvas, sized to the hero (not the window), so
// it works inside the scrolling page and the site's 0.9 zoom. The approach
// plays once per tab; after that the film starts on Earth.

const TO_EARTH = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4";
// Moments in the Earth footage, as shares of its length
const AT_EARTH = 0.3; // the whole planet in space: where the approach stops
const AT_GROUND = 0.62; // through the clouds, just above the ground
const KEY = "ogcw-planet-intro-seen";
const STAGE = "rgb(10,10,10)"; // the product photos' own black

// How long each part lasts, in ms of film time
const HOLD_EARTH = 2800;
const HOLD_PLACE = 3800;
const HOLD_PIECE = 3400;
const CROSS = 1300;
const LAND = 950;

type Link = { text: string; href: string };
type Row = [string, string | Link];
type Look = { src: string; fit: "cover" | "contain"; pos?: [number, number] };
type Scene = { key: string; label: string; title: string; look: Look | "earth"; rows: Row[]; hold: number };

const aisle = (slug: string) => SHOP_CATEGORIES.find((category) => category.slug === slug)!;
const ONE_PIECE = ["ope-ope", "gomu-gomu", "mera-mera"].flatMap((name) => getProduct(`one-piece-air-max-plus-${name}`) ?? []);
/** The pair's nickname, the words in quotes: “Ope Ope” */
const nickname = (product: ShopProduct) => /“([^”]+)”/.exec(product.name)?.[1] ?? product.name;
const piece = (product: ShopProduct): Scene => ({
  key: product.id,
  label: nickname(product),
  title: nickname(product),
  look: { src: product.image, fit: "contain" },
  rows: [
    ["Piece:", { text: fullName(product), href: `/shop/p/${product.id}` }],
    ["Colour:", product.colour],
    ["Brand:", brandOf(product).name],
    ["Bought from:", retailerOf(product).name],
  ],
  hold: HOLD_PIECE,
});
const SCENES: Scene[] = [
  {
    key: "earth", label: "Earth", title: "Earth", look: "earth", hold: HOLD_EARTH,
    rows: [
      ["Distance:", "149.6 million km from the Sun."],
      ["Year:", "365.25 Earth days."],
      ["Temperature:", "Average surface temperature around 15 °C."],
      ["Atmosphere:", "Mostly nitrogen and oxygen, supporting life and liquid water."],
    ],
  },
  {
    key: "shop", label: "The shop", title: "The shop", look: { src: "/shop/looks/hero.webp", fit: "cover", pos: [0.5, 0.45] }, hold: HOLD_PLACE,
    rows: [
      ["Aisles:", "Sneakers, clothing, watches and chains, streaming."],
      ["Picked by:", "OGCW."],
      ["Bought from:", "Straight from the shop that makes it."],
      ["Start here:", { text: "Shop the latest", href: "/shop/all?tag=new" }],
    ],
  },
  {
    key: "sneakers", label: "Sneakers", title: "Sneakers", look: { src: "/shop/looks/sneakers.webp", fit: "cover" }, hold: HOLD_PLACE,
    rows: [
      ["Aisle:", { text: "Sneakers", href: "/shop/all?cat=sneakers" }],
      ["In it:", aisle("sneakers").blurb],
      ["New in:", "One Piece x Air Max Plus."],
      ["Picked by:", "OGCW."],
    ],
  },
  {
    key: "one-piece", label: "One Piece", title: "One Piece", look: { src: "/shop/one-piece-air-max-plus-pack.webp", fit: "contain" }, hold: HOLD_PIECE,
    rows: [
      ["Collection:", { text: "Nike x One Piece", href: "/shop/nike" }],
      ["Model:", "Nike Air Max Plus."],
      ["Pairs:", "Ope Ope, Gomu Gomu and Mera Mera."],
      ["Aisle:", "Sneakers · Running."],
    ],
  },
  ...ONE_PIECE.map(piece),
  {
    key: "clothing", label: "Clothing", title: "Clothing", look: { src: "/shop/looks/clothing.webp", fit: "cover" }, hold: HOLD_PLACE,
    rows: [
      ["Aisle:", { text: "Clothing", href: "/shop/all?cat=clothing" }],
      ["In it:", aisle("clothing").blurb],
      ["Picked by:", "OGCW."],
      ["Bought from:", "Straight from the shop that makes it."],
    ],
  },
  {
    key: "watches", label: "Watches & chains", title: "Watches", look: { src: "/shop/looks/watches.webp", fit: "cover" }, hold: HOLD_PLACE,
    rows: [
      ["Aisle:", { text: "Watches & chains", href: "/shop/all?cat=accessories" }],
      ["In it:", aisle("accessories").blurb],
      ["Picked by:", "OGCW."],
      ["Bought from:", "Straight from the shop that makes it."],
    ],
  },
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function PlanetHero() {
  const root = useRef<HTMLElement>(null);
  const router = useRouter();
  const go = useRef((href: string) => router.history.push(href));
  go.current = (href: string) => router.history.push(href);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const $ = <T extends Element>(selector: string) => el.querySelector<T>(selector)!;
    const earth = $<HTMLVideoElement>(".pj-source");
    const count = $<HTMLDivElement>(".pj-count");
    const countValue = $<HTMLSpanElement>(".pj-count-value");
    const canvas = $<HTMLCanvasElement>(".pj-canvas");
    const list = $<HTMLElement>(".pj-scenes");
    const content = $<HTMLDivElement>(".pj-content");
    const title = $<HTMLHeadingElement>(".pj-title");
    const facts = $<HTMLDListElement>(".pj-facts");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    earth.muted = true;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const images = new Map<string, HTMLImageElement>();
    for (const scene of SCENES) {
      if (scene.look === "earth" || images.has(scene.look.src)) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = scene.look.src;
      images.set(scene.look.src, img);
    }

    let alive = true;
    let visible = true;
    let W = 0, H = 0;
    let frame = 0, last = performance.now();
    let clock = 0; // film time: only runs while the film is playing
    const running = () => visible && !pausedRef.current && !document.hidden;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => { timers.push(window.setTimeout(() => { if (alive) fn(); }, ms)); };

    /* ---------- Film time: waits and tweens that stop when the film does ---------- */
    type Tween = { start: number; ms: number; set?: (v: number) => void; resolve: () => void };
    const tweens = new Set<Tween>();
    const tween = (ms: number, set?: (v: number) => void) => new Promise<void>((resolve) => { tweens.add({ start: clock, ms, ...(set ? { set } : {}), resolve }); });
    const wait = (ms: number) => tween(ms);
    let diving: { until: number; resolve: () => void } | null = null;

    /* ---------- What is on screen ---------- */
    type Shot = { scene: Scene; since: number };
    let shot: Shot = { scene: SCENES[0]!, since: 0 };
    let incoming: Shot | null = null;
    let mix = 0;
    let style: "forward" | "back" | "land" = "forward";

    const resize = () => {
      W = el.offsetWidth;
      H = el.offsetHeight;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      fitTitle();
    };
    /** A slow push in while a scene is on screen */
    const drift = (since: number) => (still ? 1 : 1 + 0.045 * Math.min(1, (clock - since) / 6500));
    const paint = (scene: Scene, zoom: number, alpha: number) => {
      if (alpha <= 0) return;
      ctx.globalAlpha = alpha;
      if (scene.look === "earth") cover(earth, zoom, [0.5, 0.5]);
      else {
        const img = images.get(scene.look.src);
        if (scene.look.fit === "cover") { if (img) cover(img, zoom, scene.look.pos ?? [0.5, 0.5]); ctx.fillStyle = "rgba(0,0,0,.24)"; ctx.fillRect(0, 0, W, H); }
        else {
          // A product on its black stage, big, above the name and the facts
          ctx.fillStyle = STAGE;
          ctx.fillRect(0, 0, W, H);
          if (img?.complete && img.naturalWidth) {
            const narrow = W < 700;
            const ratio = img.naturalWidth / img.naturalHeight;
            let h = H * (narrow ? 0.62 : 0.95);
            let w = h * ratio;
            // Clear of the scene list; on a phone a single pair may lose some black edge, the pack shot may not
            const most = W * (narrow ? (ratio > 1.2 ? 1 : 1.15) : 0.76);
            if (w > most) { w = most; h = w / ratio; }
            w *= zoom;
            h *= zoom;
            ctx.drawImage(img, W / 2 - w / 2, H * (narrow ? 0.33 : 0.42) - h / 2, w, h);
          }
        }
      }
      ctx.globalAlpha = 1;
    };
    const cover = (media: HTMLVideoElement | HTMLImageElement, zoom: number, pos: [number, number]) => {
      if (media instanceof HTMLVideoElement ? media.readyState < 2 : !media.complete) return;
      const mw = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
      const mh = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
      if (!mw || !mh) return;
      const scale = Math.max(W / mw, H / mh) * zoom;
      const w = mw * scale, h = mh * scale;
      ctx.drawImage(media, (W - w) * pos[0], (H - h) * pos[1], w, h);
    };
    const shade = () => {
      const gradient = ctx.createLinearGradient(0, H * 0.52, 0, H);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,.88)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, H * 0.52, W, H * 0.48);
    };
    const draw = (now: number) => {
      if (!alive) return;
      frame = requestAnimationFrame(draw);
      const dt = Math.min(40, now - last);
      last = now;
      const on = running();
      if (on) clock += dt;
      // The dive plays the footage; it stops with the film
      if (diving) {
        if (!on && !earth.paused) earth.pause();
        else if (on && earth.paused && earth.currentTime < diving.until) void earth.play().catch(() => {});
        if (earth.currentTime >= diving.until || earth.ended) { earth.pause(); diving.resolve(); diving = null; }
      }
      if (on) {
        for (const item of tweens) {
          const t = Math.min(1, (clock - item.start) / Math.max(1, item.ms));
          item.set?.(ease(t));
          if (t >= 1) { tweens.delete(item); item.resolve(); }
        }
      }
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0908";
      ctx.fillRect(0, 0, W, H);
      const push = still ? 0 : style === "forward" ? 0.22 : 0;
      paint(shot.scene, drift(shot.since) * (1 + push * mix), 1);
      if (incoming) {
        const from = still ? 1 : style === "back" ? 1.35 : 1.14;
        paint(incoming.scene, drift(incoming.since) * (from - (from - 1) * mix), mix);
      }
      shade();
    };

    /* ---------- The words for the scene on screen ---------- */
    const row = ([key, value]: Row) => {
      const item = document.createElement("div");
      item.className = "pj-fact";
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      if (typeof value === "string") dd.textContent = value;
      else {
        const link = document.createElement("a");
        link.className = "pj-story";
        link.href = value.href;
        link.textContent = value.text;
        dd.append(link);
      }
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
    let shown = -1;
    const items = SCENES.map((scene) => {
      const span = document.createElement("span");
      span.className = "pj-item";
      span.textContent = scene.label;
      return span;
    });
    list.prepend(...items);
    const retrigger = (target: Element, cls: string) => { target.classList.remove(cls); void (target as HTMLElement).offsetWidth; target.classList.add(cls); };
    const render = (index: number) => {
      const scene = SCENES[index]!;
      el.dataset["scene"] = scene.key;
      title.textContent = scene.title.toUpperCase();
      facts.replaceChildren(...scene.rows.map(row));
      items.forEach((item, i) => item.classList.toggle("is-active", i === index));
      if (shown >= 0) retrigger(list, "is-switching");
      shown = index;
      fitTitle();
    };

    /* ---------- The film ---------- */
    const cut = async (index: number, kind: typeof style, ms: number) => {
      el.classList.add("is-transitioning");
      el.classList.remove("content-revealing");
      style = kind;
      incoming = { scene: SCENES[index]!, since: clock };
      mix = 0;
      await tween(ms, (v) => { mix = v; });
      shot = incoming;
      incoming = null;
      mix = 0;
      render(index);
      el.classList.remove("is-transitioning");
      retrigger(el, "content-revealing");
    };
    const seek = (share: number) => {
      if (!earth.duration) return Promise.resolve();
      earth.pause();
      return new Promise<void>((resolve) => {
        const done = () => { window.clearTimeout(timer); resolve(); };
        const timer = window.setTimeout(done, 3000);
        earth.addEventListener("seeked", done, { once: true });
        earth.currentTime = earth.duration * share;
      });
    };
    const film = async () => {
      while (alive) {
        await wait(SCENES[0]!.hold);
        // Down through the clouds (with reduced motion, a plain cross-fade)
        if (!still && earth.duration) {
          el.classList.add("is-transitioning");
          el.classList.remove("content-revealing");
          earth.playbackRate = 1.3;
          await new Promise<void>((resolve) => { diving = { until: earth.duration * AT_GROUND, resolve }; });
          await cut(1, "land", LAND);
        } else await cut(1, "forward", CROSS);
        void seek(AT_EARTH); // ready for the way back
        for (let i = 2; i < SCENES.length && alive; i++) {
          await wait(SCENES[i - 1]!.hold);
          await cut(i, "forward", CROSS);
        }
        await wait(SCENES[SCENES.length - 1]!.hold);
        // Back out to the whole planet
        await cut(0, "back", CROSS + 400);
      }
    };

    /* ---------- The approach to Earth ---------- */
    const begin = () => {
      el.classList.add("intro-ready");
      render(0);
      retrigger(el, "content-revealing");
      void film();
    };
    const runPreloader = () => {
      let seen = false;
      try { seen = !!sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, "1"); } catch { /* storage blocked: it plays every time */ }
      let done = false;
      let tick = 0;
      const finish = () => {
        if (done || !alive) return;
        done = true;
        cancelAnimationFrame(tick);
        earth.pause();
        countValue.textContent = "100";
        count.classList.add("is-leaving");
        el.classList.add("preload-complete");
        later(750, () => { count.hidden = true; });
        begin();
      };
      const whenReady = (fn: () => void) => (earth.readyState >= 1 ? fn() : earth.addEventListener("loadedmetadata", fn, { once: true }));
      const straightThere = () => whenReady(() => { void seek(AT_EARTH).then(finish); });
      earth.addEventListener("error", finish, { once: true });
      later(15000, finish); // a very slow connection still gets the film
      if (seen || still) { count.hidden = true; straightThere(); return; }
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
    };

    /* ---------- Links in the facts open the shop pages ---------- */
    const onLink = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a.pj-story");
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      go.current(link.getAttribute("href") ?? "/shop");
    };
    facts.addEventListener("click", onLink);
    const sizes = new ResizeObserver(() => resize());
    sizes.observe(el);
    const seenOnScreen = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; });
    seenOnScreen.observe(el);
    void document.fonts?.ready.then(() => { if (alive) fitTitle(); });

    /* ---------- Boot ---------- */
    resize();
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
      sizes.disconnect();
      seenOnScreen.disconnect();
      facts.removeEventListener("click", onLink);
      items.forEach((item) => item.remove());
      earth.pause();
    };
  }, []);

  return (
    <section className="pj" ref={root} aria-label="The OGCW Shop, a short film">
      <video className="pj-source" src={TO_EARTH} muted playsInline preload="auto" aria-hidden="true" />
      <canvas className="pj-canvas" aria-hidden="true" />
      <div className="pj-count" aria-live="polite">
        <span className="pj-count-value">0</span><span className="pj-percent">%</span>
      </div>

      <aside className="pj-list pj-scenes pj-chrome" aria-label="Scenes">
        <button type="button" className="pj-pause" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Play the film" : "Pause the film"}>
          {paused ? <Play size={13} fill="currentColor" aria-hidden="true" /> : <Pause size={13} fill="currentColor" aria-hidden="true" />}
          <span>{paused ? "Play" : "Pause"}</span>
        </button>
      </aside>

      <div className="pj-content pj-chrome" aria-live="polite">
        <h1 className="pj-title">EARTH</h1>
        <dl className="pj-facts" />
      </div>
    </section>
  );
}
