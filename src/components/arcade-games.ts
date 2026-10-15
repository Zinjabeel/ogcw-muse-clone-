// The little games on the 404 page (src/components/not-found-arcade.tsx).
// Each one draws on a 480 x 320 canvas in the page's black, white and gold,
// and is plain code: update(seconds) moves it on, draw(ctx) paints it, and
// key/down/move/up take the player's input (canvas coordinates).

export const W = 480;
export const H = 320;
export const BG = "#0d0d0d";
export const INK = "#ffffff";
export const GOLD = "#F4B921";
const DIM = "rgba(255,255,255,0.09)";

export type Game = {
  score: number;
  over: boolean;
  update: (dt: number) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  /** True when the game used the key */
  key?: (code: string, down: boolean) => boolean;
  down?: (x: number, y: number) => void;
  move?: (x: number, y: number) => void;
  up?: (x: number, y: number) => void;
};

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function clear(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
}

const DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};
const JUMP = new Set(["Space", "ArrowUp", "KeyW", "Enter"]);

// ------------------------------------------------------------ Snake

export function snake(): Game {
  const S = 20;
  const COLS = W / S;
  const ROWS = H / S;
  type P = { x: number; y: number };
  let body: P[] = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
  let dir: P = { x: 1, y: 0 };
  const queue: P[] = [];
  let food: P = { x: 16, y: 8 };
  let wait = 0;
  let every = 0.12;
  let swipe: P | null = null;

  const place = (): P => {
    for (;;) {
      const spot = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      if (!body.some((p) => p.x === spot.x && p.y === spot.y)) return spot;
    }
  };
  // Turns wait their turn, so two quick presses can't fold the snake back on itself
  const turn = (x: number, y: number) => {
    const last = queue[queue.length - 1] ?? dir;
    if (queue.length > 2 || (x === last.x && y === last.y) || (x === -last.x && y === -last.y)) return;
    queue.push({ x, y });
  };

  const game: Game = {
    score: 0,
    over: false,
    update(dt) {
      wait += dt;
      while (wait >= every && !game.over) {
        wait -= every;
        dir = queue.shift() ?? dir;
        const head = body[0]!;
        const next = { x: head.x + dir.x, y: head.y + dir.y };
        const eat = next.x === food.x && next.y === food.y;
        const rest = eat ? body : body.slice(0, -1);
        if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS || rest.some((p) => p.x === next.x && p.y === next.y)) {
          game.over = true;
          return;
        }
        body = [next, ...rest];
        if (eat) {
          game.score += 1;
          food = place();
          every = Math.max(0.065, every - 0.003);
        }
      }
    },
    draw(ctx) {
      clear(ctx);
      ctx.fillStyle = DIM;
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) ctx.fillRect(x * S + S / 2 - 1, y * S + S / 2 - 1, 2, 2);
      ctx.fillStyle = GOLD;
      box(ctx, food.x * S + 4, food.y * S + 4, S - 8, S - 8, 4);
      body.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? GOLD : INK;
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.4, 1 - i * 0.025);
        box(ctx, p.x * S + 1, p.y * S + 1, S - 2, S - 2, 6);
      });
      ctx.globalAlpha = 1;
      const head = body[0]!;
      ctx.fillStyle = BG;
      const cx = head.x * S + S / 2 + dir.x * 4;
      const cy = head.y * S + S / 2 + dir.y * 4;
      ctx.fillRect(cx - 1.5 + dir.y * 4, cy - 1.5 + dir.x * 4, 3, 3);
      ctx.fillRect(cx - 1.5 - dir.y * 4, cy - 1.5 - dir.x * 4, 3, 3);
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

// ------------------------------------------------------------ Dino Jump

export function dino(): Game {
  const GROUND = 272;
  const me = { x: 64, y: GROUND - 40, w: 34, h: 40, vy: 0 };
  type Ob = { x: number; y: number; w: number; h: number; bird: boolean };
  const obs: Ob[] = [{ x: 330, y: GROUND - 46, w: 20, h: 46, bird: false }];
  let speed = 280;
  let dist = 0;
  let gap = 1.2;
  let t = 0;
  const onGround = () => me.y >= GROUND - me.h - 0.5;
  const jump = () => { if (onGround()) me.vy = -690; };
  const hit = (o: Ob) => me.x + 6 < o.x + o.w && me.x + me.w - 6 > o.x && me.y + 4 < o.y + o.h && me.y + me.h - 2 > o.y;

  const spawn = (score: number) => {
    if (score > 12 && Math.random() < 0.3) {
      const high = Math.random() < 0.5;
      obs.push({ x: W + 20, y: high ? GROUND - 94 : GROUND - 48, w: 34, h: 22, bird: true });
    } else {
      const tall = 30 + Math.random() * 22;
      obs.push({ x: W + 20, y: GROUND - tall, w: Math.random() < 0.3 ? 40 : 20, h: tall, bird: false });
    }
  };

  const game: Game = {
    score: 0,
    over: false,
    update(dt) {
      t += dt;
      speed = Math.min(640, speed + 9 * dt);
      dist += speed * dt;
      game.score = Math.floor(dist / 40);
      me.vy += 2100 * dt;
      me.y = Math.min(GROUND - me.h, me.y + me.vy * dt);
      if (onGround()) me.vy = 0;
      for (const o of obs) o.x -= speed * dt * (o.bird ? 1.12 : 1);
      while (obs.length && obs[0]!.x + obs[0]!.w < -20) obs.shift();
      gap -= dt;
      if (gap <= 0) {
        spawn(game.score);
        gap = 0.85 + Math.random() * 0.9;
      }
      if (obs.some(hit)) game.over = true;
    },
    draw(ctx) {
      clear(ctx);
      // The ground and its pebbles running by
      ctx.fillStyle = INK;
      ctx.fillRect(0, GROUND, W, 2);
      ctx.fillStyle = DIM;
      for (let i = 0; i < 16; i++) {
        const x = ((i * 53 - dist * 0.999) % W + W) % W;
        ctx.fillRect(x, GROUND + 8 + (i % 3) * 7, 6 + (i % 4) * 3, 2);
      }
      // The dino: gold blocks, legs taking turns while it runs
      const { x, y } = me;
      ctx.fillStyle = GOLD;
      box(ctx, x, y + 12, 26, 20, 4);
      box(ctx, x + 14, y, 22, 15, 4);
      ctx.fillRect(x - 7, y + 14, 9, 6);
      ctx.fillRect(x + 22, y + 18, 7, 3);
      const step = onGround() ? Math.floor(t * 12) % 2 : 0;
      ctx.fillRect(x + 5, y + 30, 6, step ? 6 : 10);
      ctx.fillRect(x + 16, y + 30, 6, step ? 10 : 6);
      ctx.fillStyle = BG;
      ctx.fillRect(x + 28, y + 4, 3, 3);
      // Cactuses and birds
      for (const o of obs) {
        ctx.fillStyle = INK;
        if (o.bird) {
          const flap = Math.sin(t * 14) > 0;
          box(ctx, o.x + 6, o.y + 8, 24, 9, 4);
          ctx.fillRect(o.x, o.y + 10, 8, 4);
          ctx.beginPath();
          ctx.moveTo(o.x + 12, o.y + 10);
          ctx.lineTo(o.x + 24, o.y + 10);
          ctx.lineTo(o.x + 16, flap ? o.y - 4 : o.y + 24);
          ctx.fill();
        } else {
          const stems = o.w > 30 ? [o.x, o.x + 22] : [o.x];
          for (const sx of stems) {
            box(ctx, sx + 5, o.y, 10, o.h, 4);
            box(ctx, sx, o.y + o.h * 0.35, 4, o.h * 0.3, 2);
            box(ctx, sx + 16, o.y + o.h * 0.2, 4, o.h * 0.3, 2);
          }
        }
      }
    },
    key(code, down) {
      if (!JUMP.has(code)) return false;
      if (down) jump();
      return true;
    },
    down() { jump(); },
  };
  return game;
}

// ------------------------------------------------------------ Brick Breaker

export function breakout(): Game {
  const pad = { x: W / 2 - 42, y: H - 22, w: 84, h: 10 };
  const ball = { x: W / 2, y: H - 34, vx: 0, vy: 0, r: 6 };
  type Brick = { x: number; y: number; w: number; h: number; row: number };
  let bricks: Brick[] = [];
  let speed = 300;
  const held = { l: false, r: false };

  const build = () => {
    bricks = [];
    for (let row = 0; row < 5; row++) for (let col = 0; col < 10; col++) bricks.push({ x: 6 + col * 47, y: 34 + row * 20, w: 44, h: 14, row });
  };
  const launch = () => {
    ball.x = pad.x + pad.w / 2;
    ball.y = pad.y - 12;
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    ball.vx = Math.cos(a) * speed;
    ball.vy = Math.sin(a) * speed;
  };
  const aim = (vx: number, vy: number) => {
    const length = Math.hypot(vx, vy) || 1;
    ball.vx = (vx / length) * speed;
    ball.vy = (vy / length) * speed;
  };
  const slide = (x: number) => { pad.x = Math.max(0, Math.min(W - pad.w, x - pad.w / 2)); };
  build();
  launch();

  const game: Game = {
    score: 0,
    over: false,
    update(dt) {
      pad.x = Math.max(0, Math.min(W - pad.w, pad.x + (Number(held.r) - Number(held.l)) * 460 * dt));
      const steps = Math.ceil((speed * dt) / 3);
      for (let i = 0; i < steps && !game.over; i++) {
        ball.x += (ball.vx * dt) / steps;
        ball.y += (ball.vy * dt) / steps;
        if (ball.x < ball.r) ball.vx = Math.abs(ball.vx);
        if (ball.x > W - ball.r) ball.vx = -Math.abs(ball.vx);
        if (ball.y < ball.r) ball.vy = Math.abs(ball.vy);
        if (ball.y > H + ball.r) { game.over = true; return; }
        if (ball.vy > 0 && ball.y + ball.r >= pad.y && ball.y - ball.r <= pad.y + pad.h && ball.x >= pad.x - ball.r && ball.x <= pad.x + pad.w + ball.r) {
          const off = Math.max(-1, Math.min(1, (ball.x - (pad.x + pad.w / 2)) / (pad.w / 2)));
          aim(Math.sin(off * 1.05), -Math.cos(off * 1.05));
          ball.y = pad.y - ball.r;
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
          bricks.splice(index, 1);
          game.score += 1;
          speed = Math.min(560, speed + 3);
          aim(ball.vx, ball.vy);
          if (!bricks.length) {
            build();
            speed += 20;
            launch();
          }
        }
      }
    },
    draw(ctx) {
      clear(ctx);
      for (const b of bricks) {
        ctx.fillStyle = b.row < 2 ? GOLD : INK;
        ctx.globalAlpha = b.row === 4 ? 0.55 : 1;
        box(ctx, b.x, b.y, b.w, b.h, 3);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = INK;
      box(ctx, pad.x, pad.y, pad.w, pad.h, 5);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
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

// ------------------------------------------------------------ Sky Hop

export function skyhop(): Game {
  const bird = { x: 120, y: 150, vy: 0, r: 11 };
  type Pipe = { x: number; gap: number; passed: boolean };
  const pipes: Pipe[] = [{ x: 320, gap: 150, passed: false }];
  const GAP = 116;
  const PW = 54;
  const SPEED = 150;
  const FLOOR = H - 14;
  let next = 1.6;
  let t = 0;
  const flap = () => { bird.vy = -360; };

  const game: Game = {
    score: 0,
    over: false,
    update(dt) {
      t += dt;
      bird.vy = Math.min(520, bird.vy + 1250 * dt);
      bird.y += bird.vy * dt;
      for (const p of pipes) {
        p.x -= SPEED * dt;
        if (!p.passed && p.x + PW < bird.x - bird.r) {
          p.passed = true;
          game.score += 1;
        }
      }
      while (pipes.length && pipes[0]!.x + PW < -10) pipes.shift();
      next -= dt;
      if (next <= 0) {
        next = 1.55;
        pipes.push({ x: W + 10, gap: 74 + Math.random() * (FLOOR - 148), passed: false });
      }
      const r = bird.r - 2;
      if (bird.y + r > FLOOR || bird.y - r < 0) game.over = true;
      if (pipes.some((p) => bird.x + r > p.x && bird.x - r < p.x + PW && (bird.y - r < p.gap - GAP / 2 || bird.y + r > p.gap + GAP / 2))) game.over = true;
    },
    draw(ctx) {
      clear(ctx);
      for (const p of pipes) {
        const top = p.gap - GAP / 2;
        const bottom = p.gap + GAP / 2;
        ctx.fillStyle = INK;
        box(ctx, p.x, -8, PW, top + 8, 6);
        box(ctx, p.x, bottom, PW, FLOOR - bottom + 8, 6);
        ctx.fillStyle = GOLD;
        box(ctx, p.x - 4, top - 12, PW + 8, 12, 4);
        box(ctx, p.x - 4, bottom, PW + 8, 12, 4);
      }
      ctx.fillStyle = BG;
      ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.fillStyle = INK;
      ctx.fillRect(0, FLOOR, W, 2);
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(Math.max(-0.5, Math.min(0.9, bird.vy / 600)));
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(-4, Math.sin(t * 18) * 3 + 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = BG;
      ctx.fillRect(6, -5, 2, 2);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(10, -1);
      ctx.lineTo(17, 2);
      ctx.lineTo(10, 5);
      ctx.fill();
      ctx.restore();
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
