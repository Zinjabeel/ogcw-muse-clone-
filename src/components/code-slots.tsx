import { useCallback, useEffect, useId, useRef, useState, type ClipboardEvent, type CSSProperties, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";

// CodeSlots, from React Bits (reactbits.dev, MIT licence): one box per digit
// of a text-message code. A typed digit lands with a fill that springs up
// under it; a wrong code drains the boxes last to first in red and clears
// them; the right one merges the fills into one wash with a tick.
// Rebuilt without its packages (owner, 21 Oct 2026: no new packages): the
// original's springs are CSS transitions (with a slight overshoot), staggered
// with per-box delays, and the tick is drawn here instead of coming from
// Hugeicons. Typing, pasting, the arrow keys, Backspace and the phone's
// "fill in the code from messages" all work as in the original.
// Styles in src/styles/code-slots.css.

type Status = "idle" | "error" | "success";

const digitsOf = (raw: unknown) => String(raw ?? "").replace(/\D/g, "");
const toSlots = (raw: string, n: number) => {
  const d = digitsOf(raw).slice(0, n);
  return Array.from({ length: n }, (_, i) => d[i] ?? "");
};
const firstEmptyOf = (slots: string[]) => {
  const i = slots.indexOf("");
  return i === -1 ? slots.length - 1 : i;
};
const isFull = (slots: string[]) => slots.every(Boolean);

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduce;
}

export type CodeSlotsProps = {
  length?: number;
  defaultValue?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  status?: Status;
  mask?: boolean;
  caret?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: string;
  inkColor?: string;
  slotColor?: string;
  digitColor?: string;
  dangerColor?: string;
  slotSize?: number;
  gap?: number;
  radius?: number;
  /** Overshoot of the landing fill, 0 to about 0.4 */
  bounce?: number;
  /** Seconds a digit takes to land or drain */
  settle?: number;
  rise?: number;
  /** Milliseconds between boxes when several land at once, or drain */
  cascade?: number;
  ariaLabel?: string;
  className?: string;
};

export default function CodeSlots({
  length = 6,
  defaultValue = "",
  onChange,
  onComplete,
  status = "idle",
  mask = false,
  caret = true,
  disabled = false,
  autoFocus = false,
  accentColor = "#f5f5f5",
  inkColor = "#f5f5f5",
  slotColor = "#27272a",
  digitColor = "#18181b",
  dangerColor = "#ff3b30",
  slotSize = 44,
  gap = 8,
  radius = 12,
  bounce = 0.2,
  settle = 0.3,
  rise = 8,
  cascade = 20,
  ariaLabel = "One-time code",
  className = "",
}: CodeSlotsProps) {
  const uid = useId();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState(() => toSlots(defaultValue, length));
  const [active, setActive] = useState(() => firstEmptyOf(toSlots(defaultValue, length)));
  const [focused, setFocused] = useState(false);
  // How long each box waits before it lands or drains (the cascade)
  const [delays, setDelays] = useState<number[]>(() => Array.from({ length }, () => 0));
  const [draining, setDraining] = useState(false);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const drainTimer = useRef<number | undefined>(undefined);

  const pitch = slotSize + gap;
  const height = Math.round(slotSize * 1.18);
  const step = reduce ? 0 : cascade;

  const commit = useCallback((next: string[], nextDelays: number[]) => {
    const prev = slotsRef.current;
    slotsRef.current = next;
    setDelays(nextDelays);
    setSlots(next);
    const code = next.join("");
    onChange?.(code);
    if (!isFull(prev) && isFull(next)) onComplete?.(code);
  }, [onChange, onComplete]);

  const insert = (raw: string, from = active) => {
    const digits = digitsOf(raw);
    if (!digits) return;
    const next = [...slotsRef.current];
    const nextDelays = Array.from({ length }, () => 0);
    let i = from;
    for (const ch of digits) {
      if (i >= length) break;
      next[i] = ch;
      nextDelays[i] = (i - from) * step;
      i += 1;
    }
    if (i === from) return;
    commit(next, nextDelays);
    setActive(Math.min(i, length - 1));
  };
  const clearSlot = (i: number, stepBack = false) => {
    if (!slotsRef.current[i]) {
      if (stepBack) setActive(i);
      return;
    }
    const next = [...slotsRef.current];
    next[i] = "";
    commit(next, Array.from({ length }, () => 0));
    if (stepBack) setActive(i);
  };

  const busy = disabled || draining || status === "success";
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (busy || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key;
    if (/^[0-9]$/.test(key)) { event.preventDefault(); insert(key); }
    else if (key === "Backspace") {
      event.preventDefault();
      if (slots[active]) clearSlot(active);
      else if (active > 0) clearSlot(active - 1, true);
    } else if (key === "Delete") { event.preventDefault(); clearSlot(active); }
    else if (key === "ArrowLeft") { event.preventDefault(); setActive(Math.max(active - 1, 0)); }
    else if (key === "ArrowRight") { event.preventDefault(); setActive(Math.min(active + 1, length - 1)); }
    else if (key === "Home") { event.preventDefault(); setActive(0); }
    else if (key === "End") { event.preventDefault(); setActive(length - 1); }
  };
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (busy) return;
    event.preventDefault();
    insert(event.clipboardData.getData("text"), digitsOf(event.clipboardData.getData("text")).length >= length ? 0 : active);
  };
  // Phones fill the whole code in at once ("From Messages"): a full code starts
  // from the first box; anything shorter (a phone keyboard's digits) carries on from this one
  const onInput = (event: FormEvent<HTMLInputElement>) => {
    if (busy) return;
    const d = digitsOf(event.currentTarget.value);
    event.currentTarget.value = "";
    if (!d) return;
    insert(d, d.length >= length ? 0 : active);
  };
  const onRowMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    const row = rowRef.current;
    if (row && !draining && status !== "success") {
      const rect = row.getBoundingClientRect();
      const zoom = rect.width / (row.offsetWidth || rect.width) || 1;
      const i = Math.floor((event.clientX - rect.left) / zoom / pitch);
      setActive(Math.max(0, Math.min(i, firstEmptyOf(slotsRef.current))));
    }
    inputRef.current?.focus();
  };

  // A wrong code: the boxes drain last to first in red, then the code is cleared
  useEffect(() => {
    if (status !== "error") return;
    const filled = slotsRef.current.map((c, i) => (c ? i : -1)).filter((i) => i >= 0).reverse();
    if (!filled.length) return;
    setDraining(true);
    const nextDelays = Array.from({ length }, () => 0);
    filled.forEach((i, k) => { nextDelays[i] = k * step; });
    setDelays(nextDelays);
    setSlots(Array.from({ length }, () => ""));
    setActive(0);
    window.clearTimeout(drainTimer.current);
    drainTimer.current = window.setTimeout(() => {
      setDraining(false);
      slotsRef.current = Array.from({ length }, () => "");
      onChange?.("");
      inputRef.current?.focus();
    }, reduce ? 300 : (filled.length - 1) * step + settle * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  useEffect(() => () => window.clearTimeout(drainTimer.current), []);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  const showCaret = caret && focused && !disabled && status !== "success" && (status === "error" || !slots[active]);
  // The landing fill's overshoot: a back-out curve as strong as the bounce asked for
  const overshoot = (1 + Math.max(0, Math.min(bounce, 0.6)) * 2.2).toFixed(2);
  const style = {
    "--cs-accent": accentColor,
    "--cs-ink": inkColor,
    "--cs-slot": slotColor,
    "--cs-digit": digitColor,
    "--cs-danger": dangerColor,
    "--cs-size": `${slotSize}px`,
    "--cs-height": `${height}px`,
    "--cs-gap": `${gap}px`,
    "--cs-radius": `${Math.min(radius, slotSize / 2)}px`,
    "--cs-font": `${Math.round(slotSize * 0.5)}px`,
    "--cs-settle": `${settle}s`,
    "--cs-spring": `cubic-bezier(0.34, ${overshoot}, 0.64, 1)`,
    "--cs-rise": `${rise}px`,
    "--cs-sink": `${Math.round(height * 0.5)}px`,
    "--cs-caret": `${active * pitch}px`,
  } as CSSProperties;

  return (
    <div className={`code-slots${className ? ` ${className}` : ""}`} style={style}>
      <div ref={rowRef} className="code-slots__row" data-status={status} data-focused={focused ? "" : undefined} data-disabled={disabled ? "" : undefined} onMouseDown={onRowMouseDown}>
        <input
          ref={inputRef}
          className="code-slots__input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          defaultValue=""
          maxLength={length}
          aria-label={ariaLabel}
          aria-invalid={status === "error"}
          aria-describedby={`${uid}-count`}
          disabled={disabled}
          readOnly={status === "success"}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onInput={onInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {slots.map((ch, i) => (
          <Slot key={i} index={i} char={mask && ch ? "•" : ch} active={focused && i === active} delay={delays[i] ?? 0} />
        ))}
        <span className="code-slots__wash" aria-hidden="true">
          <span className="code-slots__check">
            <svg viewBox="0 0 24 24" width={Math.round(slotSize * 0.6)} height={Math.round(slotSize * 0.6)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        </span>
        <span className="code-slots__caret" aria-hidden="true" data-show={showCaret ? "" : undefined}>
          <span key={active} className="code-slots__caret-line" />
        </span>
      </div>
      <span id={`${uid}-count`} className="code-slots__sr" aria-live="polite">
        {status === "success" ? "Code accepted" : `${slots.filter(Boolean).length} of ${length} digits entered`}
      </span>
    </div>
  );
}

/** One box: keeps showing its last digit while it drains away */
function Slot({ index, char, active, delay }: { index: number; char: string; active: boolean; delay: number }) {
  const [shown, setShown] = useState(char);
  if (char && char !== shown) setShown(char);
  return (
    <span
      className="code-slots__slot"
      data-active={active ? "" : undefined}
      data-filled={char ? "" : undefined}
      aria-hidden="true"
      style={{ "--cs-delay": `${delay}ms`, "--cs-i": index } as CSSProperties}
    >
      <span className="code-slots__fill" />
      <span className="code-slots__digit">{shown}</span>
    </span>
  );
}
