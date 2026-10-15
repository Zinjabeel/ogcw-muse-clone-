// The games on the 404 page (src/components/not-found-arcade.tsx). Each draws
// on a 480 x 320 canvas over a see-through dark glass, in yellow, gold and
// white, with light and depth: lit orbs and blocks, shadows on the floor,
// parallax skies, a perspective floor grid, particles, pop-up points and a
// shake when you crash. update(seconds) moves a game on while it's played,
// ambient(seconds) runs its effects at all times, draw(ctx, clock) paints it,
// and key/down/move/up take the player's input (in canvas units).

export const W = 480;
export const H = 320;
export const YELLOW = "#FFE600";
export const GOLD = "#F4B921";
const TAU = Math.PI * 2;
const Y = { light: "#FFF7A8", base: "#FFE600", mid: "#F4B921", dark: "#A57A05", deep: "#4a3602" };
const WH = { light: "#ffffff", base: "#ececec", mid: "#cfcfcf", dark: "#7d7d7d" };

export type Game = {
  score: number;
  over: boolean;
  /** How hard the screen shakes, easing back to 0 */
  shake: number;
  update: (dt: number) => void;
  ambient: (dt: number) => void;
  draw: (ctx: CanvasRenderingContext2D, clock: number) => void;
  /** True when the game used the key */
  key?: (code: string, down: boolean) => boolean;
  down?: (x: number, y: number) => void;
  move?: (x: number, y: number) => void;
  up?: (x: number, y: number) => void;
};

// ------------------------------------------------------------ Drawing kit

type Ctx = CanvasRenderingContext2D;

/** The see-through dark glass every game is drawn on */
function glass(ctx: Ctx) {
  ctx.clearRect(-20, -20, W + 40, H + 40);
  ctx.fillStyle = "rgba(6,6,8,0.46)";
  ctx.fillRect(-20, -20, W + 40, H + 40);
}

function vignette(ctx: Ctx) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** A ball lit from the top left */
function orb(ctx: Ctx, x: number, y: number, r: number, light: string, base: string, dark: string) {
  const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
  g.addColorStop(0, light);
  g.addColorStop(0.5, base);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** A soft shadow on the floor */
function shadow(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.4) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, 1));
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(rx, 1), Math.max(ry, 0.5), 0, 0, TAU);
  ctx.fill();
}

/** A raised block: its side underneath, then its face lit from above, and a shine */
function bevel(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, light: string, base: string, side: string, depth = 4) {
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.roundRect(x, y + depth, w, h, r);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, light);
  g.addColorStop(0.55, base);
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 1.5, Math.max(0, w - 6), 2, 1);
  ctx.fill();
}

/** A box seen from the front and a little from the top right */
function cube(ctx: Ctx, x: number, y: number, w: number, h: number, d: number, front: string, top: string, side: string) {
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + d, y - d);
  ctx.lineTo(x + w + d, y - d);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + d, y - d);
  ctx.lineTo(x + w + d, y + h - d);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = front;
  ctx.fillRect(x, y, w, h);
}

function glow<T>(ctx: Ctx, color: string, blur: number, paint: () => T) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  const out = paint();
  ctx.restore();
  return out;
}

// ------------------------------------------------------------ Particles and pop-up points

type Bit = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; g: number; text?: string; square?: boolean };

function effects() {
  const bits: Bit[] = [];
  return {
    burst(x: number, y: number, color: string, n = 12, speed = 160, gravity = 280, size = 3, square = false) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const s = speed * (0.35 + Math.random() * 0.65);
        const max = 0.45 + Math.random() * 0.5;
        bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.25, life: max, max, size: size * (0.6 + Math.random() * 0.8), color, g: gravity, square });
      }
      if (bits.length > 280) bits.splice(0, bits.length - 280);
    },
    text(x: number, y: number, text: string, color: string = Y.base, size = 15) {
      bits.push({ x, y, vx: 0, vy: -48, life: 0.95, max: 0.95, size, color, g: 0, text });
    },
    update(dt: number) {
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i]!;
        b.life -= dt;
        if (b.life <= 0) { bits.splice(i, 1); continue; }
        b.vy += b.g * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (!b.text) b.vx *= 1 - Math.min(1, 1.6 * dt);
      }
    },
    draw(ctx: Ctx) {
      for (const b of bits) {
        const a = Math.min(1, (b.life / b.max) * 1.5);
        ctx.globalAlpha = a;
        if (b.text) {
          ctx.font = `900 ${b.size}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillText(b.text, b.x + 1, b.y + 2);
          ctx.fillStyle = b.color;
          ctx.fillText(b.text, b.x, b.y);
        } else if (b.square) {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.life * 9);
          ctx.fillStyle = b.color;
          ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size);
          ctx.restore();
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, Math.max(0.3, b.size * a), 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}

const DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};
const JUMP = new Set(["Space", "ArrowUp", "KeyW", "Enter"]);

// ------------------------------------------------------------ Snake: a golden snake on a tilted board

function snake(): Game {
  const S = 20;
  const COLS = W / S;
  const ROWS = H / S;
  type P = { x: number; y: number };
  let body: P[] = [{ x: 9, y: 8 }, { x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
  let prev: P[] = body.map((p) => ({ ...p }));
  let dir: P = { x: 1, y: 0 };
  const queue: P[] = [];
  let food: P = { x: 16, y: 8 };
  let gem: (P & { left: number }) | null = null;
  let eaten = 0;
  let wait = 0;
  let every = 0.13;
  let step = 1;
  let swipe: P | null = null;
  const fx = effects();

  const taken = (s: P) => body.some((p) => p.x === s.x && p.y === s.y) || (food.x === s.x && food.y === s.y) || (!!gem && gem.x === s.x && gem.y === s.y);
  const place = (): P => {
    for (;;) {
      const spot = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      if (!taken(spot)) return spot;
    }
  };
  const centre = (p: P) => [p.x * S + S / 2, p.y * S + S / 2] as const;
  const radius = (i: number) => (i === 0 ? 9.6 : Math.max(5.4, 8.6 - i * 0.12));
  // Turns wait their turn, so two quick presses can't fold the snake back on itself
  const turn = (x: number, y: number) => {
    const last = queue[queue.length - 1] ?? dir;
    if (queue.length > 2 || (x === last.x && y === last.y) || (x === -last.x && y === -last.y)) return;
    queue.push({ x, y });
  };

  const game: Game = {
    score: 0,
    over: false,
    shake: 0,
    update(dt) {
      if (gem) {
        gem.left -= dt;
        if (gem.left <= 0) gem = null;
      }
      wait += dt;
      while (wait >= every && !game.over) {
        wait -= every;
        dir = queue.shift() ?? dir;
        const head = body[0]!;
        const next = { x: head.x + dir.x, y: head.y + dir.y };
        const eat = next.x === food.x && next.y === food.y;
        const bonus = !!gem && next.x === gem.x && next.y === gem.y;
        const rest = eat || bonus ? body : body.slice(0, -1);
        if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS || rest.some((p) => p.x === next.x && p.y === next.y)) {
          game.over = true;
          game.shake = 0.7;
          const [x, y] = centre(head);
          fx.burst(x, y, Y.base, 34, 230);
          fx.burst(x, y, WH.light, 14, 170);
          return;
        }
        prev = body.map((p) => ({ ...p }));
        if (eat || bonus) prev.push({ ...body[body.length - 1]! });
        body = [next, ...rest];
        const [x, y] = centre(next);
        if (eat) {
          game.score += 1;
          eaten += 1;
          fx.burst(x, y, Y.base, 18, 170);
          fx.text(x, y - 16, "+1");
          food = place();
          every = Math.max(0.065, every - 0.0035);
          if (eaten % 5 === 0 && !gem) gem = { ...place(), left: 6 };
        }
        if (bonus) {
          game.score += 5;
          fx.burst(x, y, WH.light, 28, 230);
          fx.text(x, y - 16, "+5", WH.light, 18);
          gem = null;
        }
      }
      step = Math.min(1, wait / every);
    },
    ambient(dt) { fx.update(dt); },
    draw(ctx, clock) {
      glass(ctx);
      // The board: faint tiles in a checker, and a glowing rim
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          ctx.fillStyle = (x + y) % 2 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.018)";
          ctx.fillRect(x * S, y * S, S, S);
        }
      }
      glow(ctx, Y.base, 14, () => {
        ctx.strokeStyle = "rgba(255,230,0,0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, W - 2, H - 2);
      });
      // The gold: a glowing orb bobbing over its shadow
      const bob = Math.sin(clock * 4) * 3;
      const [fx0, fy0] = centre(food);
      shadow(ctx, fx0 + 2, fy0 + 6, 7 - bob * 0.4, 3, 0.55);
      glow(ctx, Y.base, 20, () => orb(ctx, fx0, fy0 - 5 - bob, 6.8, Y.light, Y.base, Y.dark));
      // The white gem: +5 while its ring lasts
      if (gem) {
        const [gx, gy] = centre(gem);
        shadow(ctx, gx + 2, gy + 6, 7, 3, 0.5);
        glow(ctx, WH.light, 18, () => {
          ctx.save();
          ctx.translate(gx, gy - 6 - bob);
          ctx.scale(Math.cos(clock * 3), 1);
          const g = ctx.createLinearGradient(-8, -9, 8, 9);
          g.addColorStop(0, WH.light);
          g.addColorStop(1, WH.dark);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 9);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx, gy - 6, 13, -Math.PI / 2, -Math.PI / 2 + TAU * (gem.left / 6));
        ctx.stroke();
      }
      // The snake glides between squares rather than jumping
      const pts = body.map((p, i) => {
        const q = prev[i] ?? p;
        return [(q.x + (p.x - q.x) * step) * S + S / 2, (q.y + (p.y - q.y) * step) * S + S / 2] as const;
      });
      pts.forEach(([x, y], i) => shadow(ctx, x + 3, y + 6, radius(i) + 2, radius(i) * 0.6, 0.45));
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = Y.dark;
      ctx.lineWidth = 13;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - 2) : ctx.moveTo(x, y - 2)));
      ctx.stroke();
      ctx.restore();
      for (let i = pts.length - 1; i >= 0; i--) {
        const [x, y] = pts[i]!;
        if (i % 2) orb(ctx, x, y - 2, radius(i), Y.light, Y.mid, Y.dark);
        else orb(ctx, x, y - 2, radius(i), Y.light, Y.base, Y.dark);
      }
      const [hx, hy] = pts[0]!;
      for (const side of [-1, 1]) {
        const ex = hx + dir.x * 3.5 - dir.y * side * 4.6;
        const ey = hy - 3 + dir.y * 3.5 + dir.x * side * 4.6;
        orb(ctx, ex, ey, 3.3, WH.light, WH.light, WH.mid);
        ctx.fillStyle = "#0a0a0a";
        ctx.beginPath();
        ctx.arc(ex + dir.x * 1.3, ey + dir.y * 1.3, game.over ? 0.9 : 1.8, 0, TAU);
        ctx.fill();
      }
      fx.draw(ctx);
      vignette(ctx);
    },
    key(code, down) {
      const d = DIRS[code];
      if (!d) return false;
      if (down) turn(d[0], d[1]);
      return true;
    },
    down(x, y) { swipe = { x, y }; },
    move(x, y) {
      if (!swipe) return;
      const dx = x - swipe.x;
      const dy = y - swipe.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0);
      else turn(0, Math.sign(dy));
      swipe = { x, y };
    },
    up() { swipe = null; },
  };
  return game;
}

// ------------------------------------------------------------ Dino Jump: a gold block dino running the night

function dino(): Game {
  const GROUND = 236;
  const me = { x: 70, y: GROUND - 40, w: 34, h: 40, vy: 0 };
  type Ob = { x: number; y: number; w: number; h: number; bird: boolean };
  const obs: Ob[] = [{ x: 330, y: GROUND - 46, w: 20, h: 46, bird: false }];
  let speed = 290;
  let dist = 0;
  let gap = 1.2;
  let t = 0;
  let squash = 0;
  let dust = 0;
  let milestone = 100;
  const fx = effects();
  const stars = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97.3) % W, y: (i * 41.9) % (GROUND - 70), r: (i % 3) * 0.45 + 0.6, p: i * 1.7 }));
  const far = Array.from({ length: 26 }, (_, i) => 34 + ((i * 37) % 52));
  const near = Array.from({ length: 26 }, (_, i) => 16 + ((i * 53) % 40));

  const onGround = () => me.y >= GROUND - me.h - 0.5;
  const jump = () => {
    if (!onGround()) return;
    me.vy = -720;
    squash = -0.25;
    fx.burst(me.x + 17, GROUND, "rgba(255,255,255,0.6)", 6, 80, 0, 2);
  };
  // Letting go early cuts the jump short: tap for a hop, hold for a leap
  const release = () => { if (me.vy < -260) me.vy *= 0.5; };
  const hit = (o: Ob) => me.x + 7 < o.x + o.w && me.x + me.w - 7 > o.x && me.y + 5 < o.y + o.h && me.y + me.h - 2 > o.y;

  const spawn = (score: number) => {
    if (score > 12 && Math.random() < 0.3) {
      const high = Math.random() < 0.5;
      obs.push({ x: W + 20, y: high ? GROUND - 96 : GROUND - 50, w: 36, h: 20, bird: true });
    } else {
      const tall = 30 + Math.random() * 22;
      obs.push({ x: W + 20, y: GROUND - tall, w: Math.random() < 0.3 ? 42 : 20, h: tall, bird: false });
    }
  };

  const ridge = (ctx: Ctx, heights: number[], offset: number, step: number, color: string) => {
    const n = heights.length;
    const first = Math.floor(offset / step);
    const shift = offset - first * step;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    for (let i = 0; i <= Math.ceil(W / step) + 1; i++) ctx.lineTo(i * step - shift, GROUND - heights[(i + first) % n]!);
    ctx.lineTo(W, GROUND);
    ctx.closePath();
    ctx.fill();
  };

  const game: Game = {
    score: 0,
    over: false,
    shake: 0,
    update(dt) {
      t += dt;
      speed = Math.min(640, speed + 9 * dt);
      dist += speed * dt;
      game.score = Math.floor(dist / 40);
      const was = onGround();
      me.vy += 2100 * dt;
      me.y = Math.min(GROUND - me.h, me.y + me.vy * dt);
      if (onGround()) {
        if (!was) {
          squash = 0.32;
          fx.burst(me.x + 17, GROUND, "rgba(255,255,255,0.7)", 10, 110, 180, 2.5);
        }
        me.vy = 0;
        dust -= dt;
        if (dust <= 0) {
          dust = 0.08;
          fx.burst(me.x + 2, GROUND - 2, "rgba(255,255,255,0.35)", 1, 40, -30, 2);
        }
      }
      squash += (0 - squash) * Math.min(1, dt * 9);
      for (const o of obs) o.x -= speed * dt * (o.bird ? 1.12 : 1);
      while (obs.length && obs[0]!.x + obs[0]!.w < -30) obs.shift();
      gap -= dt;
      if (gap <= 0) {
        spawn(game.score);
        gap = 0.85 + Math.random() * 0.9;
      }
      if (game.score >= milestone) {
        fx.text(W / 2, 70, `${milestone}!`, Y.base, 26);
        fx.burst(W / 2, 64, Y.base, 22, 220, 160);
        milestone += 100;
      }
      if (obs.some(hit)) {
        game.over = true;
        game.shake = 0.7;
        fx.burst(me.x + 17, me.y + 20, Y.base, 34, 240);
        fx.burst(me.x + 17, me.y + 20, WH.light, 12, 160);
      }
    },
    ambient(dt) { fx.update(dt); },
    draw(ctx, clock) {
      glass(ctx);
      // The night: a warm glow at the horizon, stars, a gold moon
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, "rgba(0,0,0,0)");
      sky.addColorStop(1, "rgba(255,230,0,0.12)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, GROUND);
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(clock * 1.4 + s.p));
        ctx.fillStyle = WH.light;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      glow(ctx, Y.base, 44, () => orb(ctx, 396, 62, 26, Y.light, Y.base, Y.mid));
      ctx.fillStyle = "rgba(165,122,5,0.35)";
      for (const [cx, cy, cr] of [[388, 56, 5], [402, 70, 4], [404, 52, 2.5]] as const) {
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, TAU);
        ctx.fill();
      }
      // Two ranges of hills, the near one passing faster
      ridge(ctx, far, dist * 0.06, 40, "rgba(255,255,255,0.07)");
      ridge(ctx, near, dist * 0.2, 30, "rgba(255,230,0,0.1)");
      // The floor: a gold grid in perspective, its lines sliding by
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.lineWidth = 1;
      for (let k = 1; k <= 7; k++) {
        const z = k / 7;
        ctx.strokeStyle = `rgba(255,230,0,${0.06 + z * 0.22})`;
        ctx.beginPath();
        ctx.moveTo(0, GROUND + (H - GROUND) * z * z);
        ctx.lineTo(W, GROUND + (H - GROUND) * z * z);
        ctx.stroke();
      }
      const slide = dist % 32;
      for (let i = -12; i <= 13; i++) {
        const top = W / 2 + i * 32 - slide;
        ctx.strokeStyle = "rgba(255,230,0,0.16)";
        ctx.beginPath();
        ctx.moveTo(top, GROUND);
        ctx.lineTo(W / 2 + (top - W / 2) * 4, H);
        ctx.stroke();
      }
      glow(ctx, Y.base, 12, () => {
        ctx.fillStyle = Y.base;
        ctx.fillRect(0, GROUND - 1, W, 2);
      });
      // Shadows first, then the cactuses and birds, then the dino
      const lift = GROUND - me.h - me.y;
      shadow(ctx, me.x + 19, GROUND + 3, Math.max(6, 20 - lift * 0.1), 4, 0.6 - Math.min(0.4, lift / 300));
      for (const o of obs) {
        if (o.bird) {
          shadow(ctx, o.x + 18, GROUND + 3, 12, 3, 0.25);
          const flap = Math.sin(clock * 14 + o.x * 0.05);
          cube(ctx, o.x + 6, o.y + 6, 24, 9, 4, WH.base, WH.light, WH.dark);
          cube(ctx, o.x - 2, o.y + 3, 10, 8, 3, WH.base, WH.light, WH.dark);
          ctx.fillStyle = Y.base;
          ctx.beginPath();
          ctx.moveTo(o.x - 2, o.y + 6);
          ctx.lineTo(o.x - 9, o.y + 8);
          ctx.lineTo(o.x - 2, o.y + 10);
          ctx.fill();
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(o.x + 1, o.y + 5, 2, 2);
          const wing = ctx.createLinearGradient(0, o.y - 10, 0, o.y + 26);
          wing.addColorStop(0, WH.light);
          wing.addColorStop(1, WH.dark);
          ctx.fillStyle = wing;
          ctx.beginPath();
          ctx.moveTo(o.x + 12, o.y + 7);
          ctx.lineTo(o.x + 26, o.y + 7);
          ctx.lineTo(o.x + 18, o.y + 7 - flap * 16);
          ctx.closePath();
          ctx.fill();
        } else {
          shadow(ctx, o.x + o.w / 2 + 3, GROUND + 3, o.w / 2 + 8, 4, 0.5);
          const stems = o.w > 30 ? [o.x, o.x + 22] : [o.x];
          for (const sx of stems) {
            cube(ctx, sx, o.y + o.h * 0.36, 5, o.h * 0.26, 3, WH.base, WH.light, WH.dark);
            cube(ctx, sx + 5, o.y, 10, o.h, 5, WH.base, WH.light, WH.dark);
            cube(ctx, sx + 15, o.y + o.h * 0.2, 5, o.h * 0.28, 3, WH.base, WH.light, WH.dark);
            ctx.fillStyle = "rgba(0,0,0,0.12)";
            ctx.fillRect(sx + 11, o.y + 3, 2, o.h - 6);
          }
        }
      }
      // The dino: gold blocks with a lit top and a shaded side, squashing as it lands
      ctx.save();
      ctx.translate(me.x + 17, me.y + me.h);
      ctx.scale(1 + squash * 0.35, 1 - squash * 0.35);
      ctx.translate(-17, -40);
      const runs = onGround() && !game.over && t > 0 ? Math.floor(t * 12) % 2 : 0;
      const block = (x: number, y: number, w: number, h: number, d = 5) => cube(ctx, x, y, w, h, d, Y.base, Y.light, Y.dark);
      block(-9, 15, 11, 7, 4);
      block(5, 30, 6, runs ? 6 : 10, 3);
      block(16, 30, 6, runs ? 10 : 6, 3);
      for (const sx of [3, 9, 15]) cube(ctx, sx, 9, 4, 3, 2, Y.mid, Y.light, Y.dark);
      block(0, 12, 26, 20);
      block(22, 20, 7, 3, 2);
      block(13, 0, 23, 15);
      block(21, 15, 13, 4, 3);
      ctx.fillStyle = WH.light;
      ctx.fillRect(28, 3, 5, 5);
      ctx.fillStyle = "#0a0a0a";
      if (game.over) {
        ctx.fillRect(28, 5, 5, 1.5);
      } else {
        ctx.fillRect(30.5, 4, 2.5, 3);
      }
      ctx.restore();
      fx.draw(ctx);
      vignette(ctx);
    },
    key(code, down) {
      if (!JUMP.has(code)) return false;
      if (down) jump();
      else release();
      return true;
    },
    down() { jump(); },
    up() { release(); },
  };
  return game;
}

// ------------------------------------------------------------ Brick Breaker: raised blocks on a tilted table

function breakout(): Game {
  const fx = effects();
  const pad = { x: W / 2 - 42, y: H - 26, w: 84, h: 11 };
  const ball = { x: W / 2, y: H - 40, vx: 0, vy: 0, r: 6, stuck: true, wait: 0.6 };
  type Brick = { x: number; y: number; w: number; h: number; row: number; hp: number };
  type Drop = { x: number; y: number };
  const STYLE = [
    { light: WH.light, base: WH.mid, side: WH.dark },
    { light: Y.light, base: Y.base, side: Y.dark },
    { light: Y.light, base: Y.base, side: Y.dark },
    { light: "#FFE98A", base: Y.mid, side: Y.deep },
    { light: "#FFE98A", base: Y.mid, side: Y.deep },
    { light: "rgba(255,255,255,0.6)", base: "rgba(255,255,255,0.26)", side: "rgba(255,255,255,0.1)" },
  ];
  let bricks: Brick[] = [];
  const drops: Drop[] = [];
  const trail: { x: number; y: number }[] = [];
  let speed = 300;
  let lives = 3;
  let combo = 0;
  let wave = 1;
  let wide = 0;
  const held = { l: false, r: false };

  const build = () => {
    bricks = [];
    for (let row = 0; row < STYLE.length; row++) for (let col = 0; col < 10; col++) bricks.push({ x: 6 + col * 47, y: 26 + row * 18, w: 44, h: 13, row, hp: row === 0 ? 2 : 1 });
  };
  const stick = (wait: number) => {
    ball.stuck = true;
    ball.wait = wait;
    trail.length = 0;
  };
  const aim = (vx: number, vy: number) => {
    const length = Math.hypot(vx, vy) || 1;
    ball.vx = (vx / length) * speed;
    ball.vy = (vy / length) * speed;
  };
  const slide = (x: number) => { pad.x = Math.max(0, Math.min(W - pad.w, x - pad.w / 2)); };
  build();

  const game: Game = {
    score: 0,
    over: false,
    shake: 0,
    update(dt) {
      // The gold capsule's wide paddle grows and shrinks around its middle
      wide = Math.max(0, wide - dt);
      const middle = pad.x + pad.w / 2;
      pad.w += ((wide > 0 ? 132 : 84) - pad.w) * Math.min(1, dt * 8);
      pad.x = Math.max(0, Math.min(W - pad.w, middle - pad.w / 2 + (Number(held.r) - Number(held.l)) * 470 * dt));

      if (ball.stuck) {
        ball.x = pad.x + pad.w / 2;
        ball.y = pad.y - ball.r - 1;
        ball.wait -= dt;
        if (ball.wait <= 0) {
          ball.stuck = false;
          aim((Math.random() - 0.5) * 0.8, -1);
        }
      } else {
        const steps = Math.ceil((speed * dt) / 3);
        for (let i = 0; i < steps && !game.over && !ball.stuck; i++) {
          ball.x += (ball.vx * dt) / steps;
          ball.y += (ball.vy * dt) / steps;
          if (ball.x < ball.r) ball.vx = Math.abs(ball.vx);
          if (ball.x > W - ball.r) ball.vx = -Math.abs(ball.vx);
          if (ball.y < ball.r) ball.vy = Math.abs(ball.vy);
          if (ball.y > H + ball.r) {
            lives -= 1;
            combo = 0;
            game.shake = 0.45;
            fx.burst(ball.x, H - 4, Y.base, 20, 200);
            if (lives <= 0) game.over = true;
            else stick(0.8);
            break;
          }
          if (ball.vy > 0 && ball.y + ball.r >= pad.y && ball.y - ball.r <= pad.y + pad.h && ball.x >= pad.x - ball.r && ball.x <= pad.x + pad.w + ball.r) {
            const off = Math.max(-1, Math.min(1, (ball.x - (pad.x + pad.w / 2)) / (pad.w / 2)));
            aim(Math.sin(off * 1.05), -Math.cos(off * 1.05));
            ball.y = pad.y - ball.r;
            combo = 0;
            fx.burst(ball.x, pad.y, WH.light, 5, 90, 200, 2);
          }
          const index = bricks.findIndex((b) => {
            const nx = Math.max(b.x, Math.min(ball.x, b.x + b.w));
            const ny = Math.max(b.y, Math.min(ball.y, b.y + b.h));
            return Math.hypot(ball.x - nx, ball.y - ny) < ball.r;
          });
          if (index >= 0) {
            const b = bricks[index]!;
            const overX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
            const overY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
            if (overX < overY) ball.vx = -ball.vx;
            else ball.vy = -ball.vy;
            b.hp -= 1;
            const style = STYLE[b.row]!;
            if (b.hp > 0) {
              fx.burst(ball.x, ball.y, style.light, 6, 120, 400, 2.5, true);
            } else {
              bricks.splice(index, 1);
              combo += 1;
              game.score += combo;
              game.shake = Math.max(game.shake, 0.08);
              fx.burst(b.x + b.w / 2, b.y + b.h / 2, style.base, 14, 190, 520, 4, true);
              if (combo > 1) fx.text(b.x + b.w / 2, b.y, `+${combo}`, combo > 4 ? WH.light : Y.base, 13 + Math.min(combo, 8));
              if (Math.random() < 0.12) drops.push({ x: b.x + b.w / 2, y: b.y + b.h });
            }
            speed = Math.min(560, speed + 3);
            aim(ball.vx, ball.vy);
            if (!bricks.length) {
              wave += 1;
              build();
              speed += 25;
              stick(1);
              fx.text(W / 2, H / 2, `WAVE ${wave}`, Y.base, 28);
            }
          }
        }
        trail.push({ x: ball.x, y: ball.y });
        if (trail.length > 12) trail.shift();
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]!;
        d.y += 130 * dt;
        if (d.y > pad.y - 6 && d.y < pad.y + pad.h + 6 && d.x > pad.x - 12 && d.x < pad.x + pad.w + 12) {
          drops.splice(i, 1);
          wide = 10;
          fx.text(d.x, pad.y - 14, "WIDE!", Y.base, 16);
          fx.burst(d.x, pad.y, Y.base, 16, 180);
        } else if (d.y > H + 10) drops.splice(i, 1);
      }
    },
    ambient(dt) { fx.update(dt); },
    draw(ctx, clock) {
      glass(ctx);
      // The table: a faint grid and glowing gold rails
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 40; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 40; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      glow(ctx, Y.base, 14, () => {
        ctx.fillStyle = "rgba(255,230,0,0.75)";
        ctx.fillRect(0, 0, 3, H);
        ctx.fillRect(W - 3, 0, 3, H);
        ctx.fillRect(0, 0, W, 3);
      });
      const danger = ctx.createLinearGradient(0, H - 30, 0, H);
      danger.addColorStop(0, "rgba(255,230,0,0)");
      danger.addColorStop(1, "rgba(255,230,0,0.12)");
      ctx.fillStyle = danger;
      ctx.fillRect(0, H - 30, W, 30);
      for (const b of bricks) {
        const style = STYLE[b.row]!;
        bevel(ctx, b.x, b.y, b.w, b.h, 3, style.light, style.base, style.side, 4);
        if (b.row === 0 && b.hp === 1) {
          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(b.x + 12, b.y + 2);
          ctx.lineTo(b.x + 20, b.y + 7);
          ctx.lineTo(b.x + 16, b.y + 12);
          ctx.moveTo(b.x + 20, b.y + 7);
          ctx.lineTo(b.x + 30, b.y + 5);
          ctx.stroke();
        }
      }
      for (const d of drops) {
        glow(ctx, Y.base, 14, () => bevel(ctx, d.x - 13, d.y - 6, 26, 12, 6, Y.light, Y.base, Y.dark, 3));
        ctx.fillStyle = "#0a0a0a";
        ctx.font = "900 8px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("W", d.x, d.y + 3);
      }
      // The paddle, its shadow and its gold strip
      shadow(ctx, pad.x + pad.w / 2 + 3, pad.y + pad.h + 6, pad.w / 2 + 6, 5, 0.55);
      bevel(ctx, pad.x, pad.y, pad.w, pad.h, 6, WH.light, WH.mid, WH.dark, 5);
      glow(ctx, Y.base, 10, () => {
        ctx.fillStyle = Y.base;
        ctx.fillRect(pad.x + pad.w / 2 - pad.w * 0.22, pad.y + pad.h / 2 - 1, pad.w * 0.44, 2.5);
      });
      // The ball and its trail
      trail.forEach((p, i) => {
        ctx.globalAlpha = (i / trail.length) * 0.35;
        ctx.fillStyle = Y.base;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ball.r * (0.4 + (i / trail.length) * 0.6), 0, TAU);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      shadow(ctx, ball.x + 4, ball.y + 8, ball.r + 1, ball.r * 0.5, 0.45);
      glow(ctx, Y.base, 18, () => orb(ctx, ball.x, ball.y, ball.r, WH.light, Y.light, Y.mid));
      // Balls left
      for (let i = 0; i < lives; i++) orb(ctx, W - 16 - i * 14, 13, 4.5, WH.light, Y.base, Y.dark);
      if (wide > 0) {
        ctx.fillStyle = `rgba(255,230,0,${0.5 + 0.3 * Math.sin(clock * 8)})`;
        ctx.fillRect(10, 10, Math.max(0, (wide / 10) * 60), 3);
      }
      fx.draw(ctx);
      vignette(ctx);
    },
    key(code, down) {
      if (code === "ArrowLeft" || code === "KeyA") held.l = down;
      else if (code === "ArrowRight" || code === "KeyD") held.r = down;
      else return false;
      return true;
    },
    down(x) { slide(x); },
    move(x) { slide(x); },
  };
  return game;
}

// ------------------------------------------------------------ Sky Hop: a gold bird through gold tubes

function skyhop(): Game {
  const fx = effects();
  const bird = { x: 120, y: 150, vy: 0, r: 12 };
  type Pipe = { x: number; gap: number; passed: boolean };
  const pipes: Pipe[] = [{ x: 320, gap: 140, passed: false }];
  const GAP = 120;
  const PW = 48;
  const SPEED = 155;
  const FLOOR = H - 26;
  let next = 1.6;
  let scroll = 0;
  let flapT = 1;
  let started = false;
  const far = Array.from({ length: 18 }, (_, i) => ({ w: 22 + ((i * 13) % 20), h: 30 + ((i * 41) % 70) }));
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: (i * 83) % W, y: 24 + ((i * 47) % 120), s: 0.7 + ((i * 0.37) % 0.6), near: i % 2 === 0 }));

  const flap = () => {
    bird.vy = -365;
    flapT = 0;
    fx.burst(bird.x - 10, bird.y + 4, "rgba(255,255,255,0.75)", 4, 70, 120, 2);
  };
  const tube = (ctx: Ctx, x: number, y: number, w: number, h: number) => {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, Y.dark);
    g.addColorStop(0.22, Y.light);
    g.addColorStop(0.5, Y.base);
    g.addColorStop(0.85, Y.mid);
    g.addColorStop(1, Y.deep);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  };
  const puff = (ctx: Ctx, x: number, y: number, s: number) => {
    for (const [dx, dy, r] of [[0, 0, 16], [16, -8, 20], [36, 0, 15], [18, 6, 16]] as const) {
      ctx.beginPath();
      ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
      ctx.fill();
    }
  };

  const game: Game = {
    score: 0,
    over: false,
    shake: 0,
    update(dt) {
      started = true;
      scroll += SPEED * dt;
      flapT += dt;
      bird.vy = Math.min(540, bird.vy + 1250 * dt);
      bird.y += bird.vy * dt;
      for (const p of pipes) {
        p.x -= SPEED * dt;
        if (!p.passed && p.x + PW < bird.x - bird.r) {
          p.passed = true;
          game.score += 1;
          fx.text(bird.x, bird.y - 26, "+1");
          fx.burst(p.x + PW, p.gap, Y.base, 10, 130, 60);
        }
      }
      while (pipes.length && pipes[0]!.x + PW < -20) pipes.shift();
      next -= dt;
      if (next <= 0) {
        next = 1.5;
        pipes.push({ x: W + 10, gap: 80 + Math.random() * (FLOOR - 160), passed: false });
      }
      const r = bird.r - 2.5;
      const crash = bird.y + r > FLOOR || bird.y - r < 0 || pipes.some((p) => bird.x + r > p.x - 4 && bird.x - r < p.x + PW + 4 && (bird.y - r < p.gap - GAP / 2 || bird.y + r > p.gap + GAP / 2));
      if (crash) {
        game.over = true;
        game.shake = 0.7;
        fx.burst(bird.x, bird.y, Y.base, 30, 220);
        fx.burst(bird.x, bird.y, WH.light, 14, 160);
      }
    },
    ambient(dt) { fx.update(dt); },
    draw(ctx, clock) {
      glass(ctx);
      const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
      sky.addColorStop(0, "rgba(0,0,0,0)");
      sky.addColorStop(1, "rgba(255,230,0,0.12)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, FLOOR);
      // A low sun, a far skyline and two layers of cloud, each at its own pace
      glow(ctx, Y.base, 50, () => {
        ctx.globalAlpha = 0.55;
        orb(ctx, 380, FLOOR - 40, 46, Y.light, Y.base, Y.mid);
        ctx.globalAlpha = 1;
      });
      const span = far.reduce((sum, b) => sum + b.w + 6, 0);
      let x0 = -((scroll * 0.15) % span);
      for (let pass = 0; pass < 2; pass++) {
        for (const b of far) {
          if (x0 > W) break;
          ctx.fillStyle = "rgba(255,255,255,0.07)";
          ctx.fillRect(x0, FLOOR - b.h, b.w, b.h);
          ctx.fillStyle = "rgba(255,230,0,0.18)";
          for (let wy = FLOOR - b.h + 6; wy < FLOOR - 6; wy += 9) for (let wx = x0 + 4; wx < x0 + b.w - 4; wx += 7) if ((wx * 7 + wy * 3) % 5 < 2) ctx.fillRect(wx, wy, 2, 3);
          x0 += b.w + 6;
        }
      }
      for (const c of clouds) {
        const pace = c.near ? 0.35 : 0.08;
        const x = ((c.x - scroll * pace - clock * 4) % (W + 120) + W + 120) % (W + 120) - 80;
        ctx.fillStyle = c.near ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.06)";
        puff(ctx, x, c.y, c.s);
      }
      // The tubes: shaded like cylinders, with an opening at each gap
      for (const p of pipes) {
        const top = p.gap - GAP / 2;
        const bottom = p.gap + GAP / 2;
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(p.x + 6, -10, PW, top + 10);
        ctx.fillRect(p.x + 6, bottom, PW, FLOOR - bottom);
        tube(ctx, p.x, -10, PW, top - 6);
        tube(ctx, p.x - 6, top - 18, PW + 12, 18);
        tube(ctx, p.x, bottom + 14, PW, FLOOR - bottom - 14);
        tube(ctx, p.x - 6, bottom, PW + 12, 18);
        for (const edge of [top, bottom]) {
          ctx.fillStyle = Y.deep;
          ctx.beginPath();
          ctx.ellipse(p.x + PW / 2, edge, PW / 2 + 5, 4.5, 0, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = Y.light;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      // The ground, its stripes running by
      const ground = ctx.createLinearGradient(0, FLOOR, 0, H);
      ground.addColorStop(0, "rgba(255,230,0,0.22)");
      ground.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = ground;
      ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.fillStyle = "rgba(255,230,0,0.25)";
      for (let i = -1; i < W / 24 + 2; i++) {
        const sx = i * 24 - (scroll % 24);
        ctx.beginPath();
        ctx.moveTo(sx, FLOOR);
        ctx.lineTo(sx + 12, FLOOR);
        ctx.lineTo(sx + 2, H);
        ctx.lineTo(sx - 10, H);
        ctx.closePath();
        ctx.fill();
      }
      glow(ctx, Y.base, 10, () => {
        ctx.fillStyle = Y.base;
        ctx.fillRect(0, FLOOR - 1, W, 2);
      });
      // The bird: a lit gold ball with a white belly and a beating wing
      const by = started ? bird.y : bird.y + Math.sin(clock * 3) * 6;
      shadow(ctx, bird.x + 4, FLOOR + 6, 14 * (1 - (FLOOR - by) / 600), 3.5, 0.45);
      ctx.save();
      ctx.translate(bird.x, by);
      ctx.rotate(game.over ? 1.2 : Math.max(-0.5, Math.min(0.9, (started ? bird.vy : 0) / 600)));
      glow(ctx, Y.base, 16, () => orb(ctx, 0, 0, bird.r, Y.light, Y.base, Y.dark));
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.ellipse(1, 5, 7, 4.5, 0, 0, TAU);
      ctx.fill();
      const beat = flapT < 0.35 ? Math.sin((flapT / 0.35) * Math.PI) * 1.1 : Math.sin(clock * 9) * 0.25;
      ctx.save();
      ctx.translate(-4, 1);
      ctx.rotate(-0.2 - beat);
      const wing = ctx.createLinearGradient(-12, -4, 2, 4);
      wing.addColorStop(0, WH.light);
      wing.addColorStop(1, WH.mid);
      ctx.fillStyle = wing;
      ctx.beginPath();
      ctx.ellipse(-5, 0, 9, 4.8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      orb(ctx, 5.5, -4.5, 4.3, WH.light, WH.light, WH.mid);
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath();
      ctx.arc(6.8, -4.2, game.over ? 0.8 : 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = Y.mid;
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(19, 1);
      ctx.lineTo(10, 2.5);
      ctx.fill();
      ctx.fillStyle = Y.dark;
      ctx.beginPath();
      ctx.moveTo(10, 2.5);
      ctx.lineTo(17, 3);
      ctx.lineTo(10, 5.5);
      ctx.fill();
      ctx.restore();
      fx.draw(ctx);
      vignette(ctx);
    },
    key(code, down) {
      if (!JUMP.has(code)) return false;
      if (down) flap();
      return true;
    },
    down() { flap(); },
  };
  return game;
}

// ------------------------------------------------------------ The line-up

export const GAMES = [
  { id: "snake", name: "Snake", tagline: "Eat the gold, never your tail. Grab the white gem for +5.", hint: "Arrow keys or swipe", tilt: 26, make: snake },
  { id: "dino", name: "Dino Jump", tagline: "Run the night. Tap for a hop, hold for a leap, stay down for high birds.", hint: "Space or tap, hold to jump higher", tilt: 0, make: dino },
  { id: "breakout", name: "Brick Breaker", tagline: "Three balls. Chain bricks for combos, catch the gold capsule for a wide paddle.", hint: "Arrow keys or drag", tilt: 20, make: breakout },
  { id: "skyhop", name: "Sky Hop", tagline: "Fly the gold bird through the gaps in the tubes.", hint: "Space or tap to fly", tilt: 0, make: skyhop },
] as const;
export type GameDef = (typeof GAMES)[number];
