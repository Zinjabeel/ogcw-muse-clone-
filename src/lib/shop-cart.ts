import { useSyncExternalStore } from "react";
import { getProduct, type ShopProduct } from "@/data/shop";
import { storePreference } from "./consent";

// The shop cart: which products, how many of each, a promo code to take to
// the shops, and whether the cart drawer is open. OGCW sells nothing itself,
// so the cart is a shopping list: checkout sends each item to its own shop.
// Kept in this browser only if the reader allows preferences (like the
// saved list); otherwise just for this visit.

export type CartLine = { id: string; qty: number };
type CartState = { lines: CartLine[]; code: string; open: boolean };

const KEY = "ogcw-shop-cart";
const EMPTY: CartState = { lines: [], code: "", open: false };
let state: CartState | null = null;
const listeners = new Set<() => void>();

function read(): CartState {
  if (state) return state;
  let lines: CartLine[] = [];
  let code = "";
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as { lines?: unknown; code?: unknown } | null;
    if (Array.isArray(raw?.lines)) {
      lines = (raw.lines as CartLine[]).filter((line) => typeof line?.id === "string" && getProduct(line.id) && Number.isInteger(line.qty) && line.qty > 0).map((line) => ({ id: line.id, qty: Math.min(line.qty, 9) }));
    }
    if (typeof raw?.code === "string") code = raw.code.slice(0, 40);
  } catch {
    // storage blocked or broken: start empty
  }
  state = { lines, code, open: false };
  return state;
}

function write(patch: Partial<CartState>) {
  const next = { ...read(), ...patch };
  state = next;
  if (patch.lines || patch.code !== undefined) storePreference(KEY, JSON.stringify({ lines: next.lines, code: next.code }));
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const cart = {
  add(id: string, qty = 1) {
    const lines = read().lines;
    const found = lines.find((line) => line.id === id);
    write({ lines: found ? lines.map((line) => (line.id === id ? { ...line, qty: Math.min(9, line.qty + qty) } : line)) : [...lines, { id, qty }], open: true });
  },
  set(id: string, qty: number) {
    const lines = read().lines;
    write({ lines: qty <= 0 ? lines.filter((line) => line.id !== id) : lines.map((line) => (line.id === id ? { ...line, qty: Math.min(9, qty) } : line)) });
  },
  remove(id: string) {
    write({ lines: read().lines.filter((line) => line.id !== id) });
  },
  clear() {
    write({ lines: [] });
  },
  /** Put lines back (the undo after clearing) */
  restore(lines: CartLine[]) {
    write({ lines });
  },
  setCode(code: string) {
    write({ code: code.trim().slice(0, 40) });
  },
  setOpen(open: boolean) {
    write({ open });
  },
};

export type CartItem = CartLine & { product: ShopProduct };

/** The cart, its items with their products, and the guide totals */
export function useCart() {
  const current = useSyncExternalStore(subscribe, read, () => EMPTY);
  const items: CartItem[] = current.lines.flatMap((line) => {
    const product = getProduct(line.id);
    return product ? [{ ...line, product }] : [];
  });
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  // Only products with a guide price count towards the subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.qty, 0);
  const unpriced = items.filter((item) => item.product.price === undefined).length;
  return { items, count, subtotal, unpriced, code: current.code, open: current.open };
}
