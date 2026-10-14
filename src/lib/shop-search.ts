import { BRANDS, LIVE_PRODUCTS, brandOf, type ShopCategory, type ShopProduct, type ShopTag } from "@/data/shop";

// The shop's search: it reads what someone typed as an intent (brands, a
// type of piece, men or women, colours, a price, and any other words),
// forgiving typos ("nike shyes" is Nike sneakers), then finds the pieces
// that fit. When nothing fits exactly it loosens the search step by step
// and says so, so there is always something close to show.

type Facet =
  | { type: "brand"; value: string }
  | { type: "kind"; value: string }
  | { type: "cat"; value: ShopCategory }
  | { type: "gender"; value: "men" | "women" }
  | { type: "colour"; value: string }
  | { type: "tag"; value: ShopTag }
  | { type: "stop" };
type Entry = { words: string[]; facet: Facet; label: string };

const norm = (text: string) => text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9$]+/g, " ").trim();
const tokens = (text: string) => norm(text).split(" ").filter(Boolean);

/** Edit distance with swapped letters counted once ("nkie" is one away from "nike") */
export function distance(a: string, b: string, max = 3) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) rows.push([i]);
  for (let j = 1; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, rows[i - 2]![j - 2]! + 1);
      rows[i]![j] = value;
      best = Math.min(best, value);
    }
    if (best > max) return max + 1;
  }
  return rows[a.length]![b.length]!;
}
/** How many typos a word of this length may have */
const slack = (word: string) => (word.length <= 3 ? 0 : word.length <= 7 ? 1 : 2);
/** 0 for the same word, 1 for a typo or a word still being typed, -1 for no match */
function near(typed: string, word: string, partial: boolean) {
  if (typed === word) return 0;
  if (partial && typed.length >= 2 && word.startsWith(typed)) return 1;
  if (typed.length > 3 && (word.startsWith(typed) || (typed.startsWith(word) && word.length > 3 && typed.length - word.length <= 1))) return 1;
  // Typos only count in longer words, so "air" never turns into "pair"
  const allowed = Math.min(slack(typed), slack(word));
  return allowed > 0 && distance(typed, word, allowed) <= allowed ? 1 : -1;
}

// ---------- The words the shop knows ----------
const BRAND_ALIASES: Record<string, string[]> = {
  jordan: ["jordan", "jordans", "air jordan", "aj"], nike: ["nike", "nikes", "swoosh"], adidas: ["adidas", "addidas", "adi"], "new-balance": ["new balance", "nb"],
  asics: ["asics", "asic"], levis: ["levis", "levi"], "denim-tears": ["denim tears"], sp5der: ["sp5der", "spider", "spyder", "sp5"], "purple-brand": ["purple brand"],
  "butter-goods": ["butter goods"], "acne-studios": ["acne studios", "acne"], "cactus-jack": ["cactus jack", "travis scott", "travis", "la flame"], nocta: ["nocta", "drake"],
  "tag-heuer": ["tag heuer", "tag"], "vacheron-constantin": ["vacheron constantin", "vacheron", "vc"], "grand-seiko": ["grand seiko", "gs"], "jaeger-lecoultre": ["jaeger lecoultre", "jaeger", "lecoultre", "jlc"],
  "bell-ross": ["bell ross", "bell and ross"], "audemars-piguet": ["audemars piguet", "audemars", "ap"], "patek-philippe": ["patek philippe", "patek"],
};
const KIND_WORDS: [string, string[], Facet][] = [
  ["sneakers", ["sneaker", "sneakers", "shoe", "shoes", "trainer", "trainers", "kicks", "footwear", "pairs", "pair"], { type: "cat", value: "Sneakers" }],
  ["basketball sneakers", ["basketball", "hoops", "retro", "retros"], { type: "kind", value: "Basketball" }],
  ["running sneakers", ["running", "runner", "runners", "runs"], { type: "kind", value: "Running" }],
  ["lifestyle sneakers", ["lifestyle", "terrace", "casual"], { type: "kind", value: "Lifestyle" }],
  ["clothing", ["clothing", "clothes", "apparel", "fits", "fit", "outfit", "streetwear"], { type: "cat", value: "Clothing" }],
  ["jeans", ["jeans", "jean", "denim", "denims"], { type: "kind", value: "Jeans" }],
  ["hoodies and sweats", ["hoodie", "hoodies", "hoody", "hooded", "sweatshirt", "sweatshirts", "sweater", "sweaters", "crewneck", "jumper", "knit", "knitwear", "cardigan", "zip up"], { type: "kind", value: "Hoodies & sweats" }],
  ["tees and shirts", ["tee", "tees", "tshirt", "tshirts", "t shirt", "t shirts", "shirt", "shirts", "top", "tops", "polo", "longsleeve", "long sleeve"], { type: "kind", value: "T-shirts & shirts" }],
  ["jackets", ["jacket", "jackets", "coat", "coats", "puffer", "puffers", "bomber", "vest", "windbreaker", "track jacket", "track top", "outerwear", "parka"], { type: "kind", value: "Jackets" }],
  ["pants", ["pants", "pant", "trousers", "sweatpants", "sweatpant", "joggers", "shorts", "cargo", "cargos", "track pants", "bottoms"], { type: "kind", value: "Pants" }],
  ["watches", ["watch", "watches", "timepiece", "timepieces", "wristwatch", "chrono", "chronograph", "diver"], { type: "kind", value: "Watches" }],
  ["caps and hats", ["cap", "caps", "hat", "hats", "beanie", "beanies", "trucker", "snapback", "fitted"], { type: "kind", value: "Caps & hats" }],
  ["bags", ["bag", "bags", "backpack", "backpacks", "tote", "pouch", "duffle", "duffel", "sling", "crossbody"], { type: "kind", value: "Bags" }],
  ["collections", ["accessories", "accessory", "collections", "collection", "jewellery", "jewelry"], { type: "cat", value: "Accessories" }],
  ["men", ["men", "mens", "man", "male", "him", "his", "guys", "guy", "boys"], { type: "gender", value: "men" }],
  ["women", ["women", "womens", "woman", "female", "her", "hers", "ladies", "lady", "girls", "girl", "wmns"], { type: "gender", value: "women" }],
  ["new in", ["new", "latest", "newest", "fresh"], { type: "tag", value: "new" }],
  ["trending", ["trending", "popular", "hot", "hype", "viral"], { type: "tag", value: "trending" }],
  ["limited", ["limited", "rare", "grail", "grails", "exclusive", "collab", "collabs"], { type: "tag", value: "limited" }],
  ["coming soon", ["upcoming", "drop", "drops", "release", "releases", "soon"], { type: "tag", value: "drops" }],
];
const COLOURS: Record<string, string[]> = {
  black: ["black", "blk", "onyx", "noir"], white: ["white", "wht", "ivory"], red: ["red", "crimson", "burgundy"], blue: ["blue", "navy", "indigo", "cobalt"],
  green: ["green", "olive", "khaki"], pink: ["pink", "rose"], brown: ["brown", "chocolate", "mocha", "tan"], grey: ["grey", "gray", "graphite", "slate"],
  yellow: ["yellow", "maize"], orange: ["orange"], purple: ["purple", "violet", "grape"], cream: ["cream", "beige", "sand", "bone"], silver: ["silver", "metallic"], gold: ["gold", "golden"],
};
const STOP = ["the", "a", "an", "for", "and", "with", "in", "of", "some", "any", "shop", "buy", "me", "i", "im", "want", "show", "looking", "need", "find", "get", "my", "to", "pls", "please", "like", "from", "by", "on", "something", "stuff", "items", "item", "piece", "pieces"];

let VOCAB: Entry[] | null = null;
function vocab(): Entry[] {
  if (VOCAB) return VOCAB;
  const live = new Set(LIVE_PRODUCTS.flatMap((product) => [product.brand, product.retailer ?? ""]));
  const entries: Entry[] = [];
  for (const brand of BRANDS) {
    if (!live.has(brand.slug)) continue;
    const words = new Set([norm(brand.name), norm(brand.slug.replace(/-/g, " ")), ...(BRAND_ALIASES[brand.slug] ?? [])]);
    entries.push({ words: [...words], facet: { type: "brand", value: brand.slug }, label: brand.name });
  }
  for (const [label, words, facet] of KIND_WORDS) entries.push({ words, facet, label });
  for (const [colour, words] of Object.entries(COLOURS)) entries.push({ words, facet: { type: "colour", value: colour }, label: colour });
  entries.push({ words: STOP, facet: { type: "stop" }, label: "" });
  VOCAB = entries;
  return entries;
}

export type Intent = {
  brands: string[]; kinds: string[]; cats: ShopCategory[]; gender?: "men" | "women"; colours: string[]; tags: ShopTag[];
  min?: number; max?: number;
  /** The words that aren't a brand, type, colour or the like */
  words: string[];
  /** The query as we read it, typos fixed ("nike shoes" for "nike shyes") */
  read: string;
  /** Whether we fixed anything */
  fixed: boolean;
  /** What it adds up to, in plain words: "Women's black Jordan sneakers" */
  label: string;
};

/** Read a query as an intent. `typing` treats the last word as unfinished. */
export function readQuery(query: string, typing = false): Intent {
  const list = tokens(query);
  const intent: Intent = { brands: [], kinds: [], cats: [], colours: [], tags: [], words: [], read: "", fixed: false, label: "" };
  const read: string[] = [];
  // Prices: "under 300", "below $2000", "over 500", "$100-$300"
  const joined = list.join(" ");
  const range = joined.match(/\$?(\d{2,6})\s*(?:to|-)\s*\$?(\d{2,6})/);
  const under = joined.match(/\b(?:under|below|less than|max|cheaper than|up to)\s*\$?(\d{2,6})/);
  const over = joined.match(/\b(?:over|above|more than|min|from)\s*\$?(\d{2,6})/);
  if (range) { intent.min = Number(range[1]); intent.max = Number(range[2]); }
  if (under) intent.max = Number(under[1]);
  if (over) intent.min = Number(over[1]);
  if (/\b(cheap|budget|affordable)\b/.test(joined)) intent.max ??= 150;
  const skip = new Set(["under", "below", "less", "than", "max", "cheaper", "up", "over", "above", "more", "min", "to", "cheap", "budget", "affordable"]);
  const entries = vocab();
  for (let i = 0; i < list.length; ) {
    const word = list[i]!;
    if (/^\$?\d+$/.test(word) && (intent.min !== undefined || intent.max !== undefined)) { i += 1; continue; }
    if (skip.has(word) && (intent.min !== undefined || intent.max !== undefined)) { i += 1; continue; }
    // The longest phrase first ("new balance", "travis scott", "t shirt")
    let found = null as { entry: Entry; size: number; exact: boolean; phrase: string; cost: number } | null;
    for (const size of [3, 2, 1]) {
      if (i + size > list.length) continue;
      const typed = list.slice(i, i + size);
      const last = i + size === list.length;
      for (const entry of entries) {
        for (const phrase of entry.words) {
          const parts = phrase.split(" ");
          if (parts.length !== size) continue;
          const scores = parts.map((part, k) => near(typed[k]!, part, typing && last && k === size - 1));
          if (scores.some((score) => score < 0)) continue;
          // Short words (ap, nb, vc) only count when typed exactly
          if (phrase.length <= 3 && scores.some((score) => score > 0)) continue;
          const exact = scores.every((score) => score === 0);
          // Of two near matches, the one with fewer typos wins ("shyes" is "shoes", not "shirts")
          const cost = exact ? 0 : parts.reduce((sum, part, k) => sum + distance(typed[k]!, part.slice(0, Math.max(typed[k]!.length, part.length)), 3), 0);
          if (!found || cost < found.cost) found = { entry, size, exact, phrase, cost };
        }
      }
      if (found) break;
    }
    if (!found) { intent.words.push(word); read.push(word); i += 1; continue; }
    const { facet } = found.entry;
    if (!found.exact) intent.fixed = true;
    read.push(found.exact ? list.slice(i, i + found.size).join(" ") : found.phrase);
    if (facet.type === "brand" && !intent.brands.includes(facet.value)) intent.brands.push(facet.value);
    if (facet.type === "kind" && !intent.kinds.includes(facet.value)) intent.kinds.push(facet.value);
    if (facet.type === "cat" && !intent.cats.includes(facet.value)) intent.cats.push(facet.value);
    if (facet.type === "gender") intent.gender = facet.value;
    if (facet.type === "colour" && !intent.colours.includes(facet.value)) intent.colours.push(facet.value);
    if (facet.type === "tag" && !intent.tags.includes(facet.value)) intent.tags.push(facet.value);
    i += found.size;
  }
  intent.read = read.join(" ");
  intent.label = labelOf(intent, read);
  return intent;
}

const KIND_LABEL: Record<string, string> = { Basketball: "basketball sneakers", Running: "running sneakers", Lifestyle: "lifestyle sneakers", Jeans: "jeans", "Hoodies & sweats": "hoodies and sweats", "T-shirts & shirts": "tees and shirts", Jackets: "jackets", Pants: "pants and shorts", Watches: "watches", "Caps & hats": "caps and hats", Bags: "bags" };
const CAT_LABEL: Record<ShopCategory, string> = { Sneakers: "sneakers", Clothing: "clothing", Accessories: "collections", Streaming: "streaming" };
const dollars = (value: number) => `$${value.toLocaleString("en-US")}`;
// A brand asked for by its founder's name keeps that name in the label
const PEOPLE: Record<string, string> = { "travis scott": "Travis Scott", travis: "Travis Scott", "la flame": "Travis Scott", drake: "Drake" };
function labelOf(intent: Intent, read: string[]) {
  const person = read.map((word) => PEOPLE[word]).find(Boolean);
  const brands = intent.brands.map((slug) => (person && (slug === "cactus-jack" || slug === "nocta") ? person : BRANDS.find((brand) => brand.slug === slug)?.name ?? slug));
  const what = intent.kinds.length ? intent.kinds.map((kind) => KIND_LABEL[kind] ?? kind.toLowerCase()) : intent.cats.map((cat) => CAT_LABEL[cat]);
  const parts = [
    intent.gender === "women" ? "Women’s" : intent.gender === "men" ? "Men’s" : "",
    intent.tags.includes("new") ? "new" : intent.tags.includes("limited") ? "limited" : intent.tags.includes("trending") ? "trending" : "",
    intent.colours.join(" and "),
    brands.join(" and "),
    intent.words.join(" "),
    what.length ? what.join(" and ") : brands.length || intent.colours.length || intent.words.length ? "" : "pieces",
    intent.tags.includes("drops") ? "on the release calendar" : "",
    intent.min !== undefined && intent.max !== undefined ? `from ${dollars(intent.min)} to ${dollars(intent.max)}` : intent.max !== undefined ? `under ${dollars(intent.max)}` : intent.min !== undefined ? `over ${dollars(intent.min)}` : "",
  ].filter(Boolean).join(" ");
  return parts ? parts[0]!.toUpperCase() + parts.slice(1) : "";
}

// ---------- Matching pieces ----------
type Indexed = { product: ShopProduct; words: string[]; name: string; colour: string };
let INDEX: Indexed[] | null = null;
function index(): Indexed[] {
  if (INDEX) return INDEX;
  INDEX = LIVE_PRODUCTS.map((product) => {
    const brand = brandOf(product);
    const text = `${brand.name} ${product.name} ${product.colour} ${product.kind} ${product.note ?? ""} ${(product.specs ?? []).map(([, value]) => value).join(" ")}`;
    // The colour it mostly is: the first two colours of the colourway, and the nickname in its name
    const lead = product.colour.split(/[/,]| and | or /).slice(0, 2).join(" ");
    return { product, words: [...new Set(tokens(text))], name: norm(`${brand.name} ${product.name}`), colour: norm(`${lead} ${product.name.match(/[‘'“"]([^’'”"]+)[’'”"]/)?.[1] ?? ""}`) };
  });
  return INDEX;
}
const brandFits = (item: Indexed, slug: string) =>
  item.product.brand === slug || item.product.retailer === slug || (BRAND_ALIASES[slug] ?? []).some((alias) => alias.length > 3 && ` ${item.name} `.includes(` ${alias} `));
const colourFits = (item: Indexed, colour: string) => (COLOURS[colour] ?? [colour]).some((word) => ` ${item.colour} `.includes(` ${word} `));
const wordFits = (item: Indexed, word: string, partial: boolean) => item.words.some((own) => near(word, own, partial) >= 0);

type Loosen = "words" | "colours" | "gender" | "price" | "tags" | "kinds" | "brands";
function fits(item: Indexed, intent: Intent, drop: Set<Loosen>, typing: boolean) {
  const p = item.product;
  if (!drop.has("brands") && intent.brands.length && !intent.brands.some((slug) => brandFits(item, slug))) return false;
  if (!drop.has("kinds") && intent.kinds.length && !intent.kinds.includes(p.kind)) return false;
  if (!drop.has("kinds") && !intent.kinds.length && intent.cats.length && !intent.cats.includes(p.category)) return false;
  if (!drop.has("gender") && intent.gender && p.gender && p.gender !== intent.gender && p.gender !== "unisex") return false;
  if (!drop.has("colours") && intent.colours.length && !intent.colours.some((colour) => colourFits(item, colour))) return false;
  if (!drop.has("tags") && intent.tags.length && !intent.tags.some((tag) => p.tags?.includes(tag))) return false;
  if (!drop.has("price") && (intent.min !== undefined || intent.max !== undefined) && (!p.price || (intent.min !== undefined && p.price < intent.min) || (intent.max !== undefined && p.price > intent.max))) return false;
  if (!drop.has("words") && !intent.words.every((word, i) => wordFits(item, word, typing && i === intent.words.length - 1))) return false;
  return true;
}
function score(item: Indexed, intent: Intent) {
  let total = 0;
  for (const word of intent.words) if (item.words.includes(word)) total += 3; else if (wordFits(item, word, true)) total += 1;
  // A colour counts most when it leads the colourway ("Black / Black / Light Graphite")
  for (const colour of intent.colours) if (colourFits(item, colour)) total += (COLOURS[colour] ?? [colour]).includes(item.colour.split(" ")[0]!) ? 4 : 1;
  if (intent.brands.includes(item.product.brand)) total += 2;
  if (item.product.tags?.includes("trending")) total += 0.5;
  if (item.product.tags?.includes("new")) total += 0.3;
  return total;
}

export type SearchResult = {
  intent: Intent;
  results: ShopProduct[];
  /** True when the pieces fit everything that was asked */
  exact: boolean;
  /** What we let go of to find something close ("the colour", "the price") */
  loosened: string[];
};

// What gives way first when nothing fits: the extras, then the words, then the type and the brand
const LOOSEN_ORDER: [Loosen, string][] = [["tags", "new or limited"], ["colours", "the colour"], ["price", "the price"], ["gender", "men or women"], ["words", "some of the words"], ["kinds", "the type"], ["brands", "the brand"]];

/** Search the live catalogue. Always returns something to show for a real query. */
export function searchShop(query: string, { typing = false, pool }: { typing?: boolean; pool?: ShopProduct[] } = {}): SearchResult {
  const intent = readQuery(query, typing);
  const items = pool ? index().filter((item) => pool.includes(item.product)) : index();
  // The other words: a typo of a word in the shop is read as that word ("seamster" is "seamaster")
  const known = shopWords();
  intent.words = intent.words.map((word, i) => {
    if (known.has(word) || (typing && i === intent.words.length - 1) || word.length < 4) return word;
    let best = word; let cost = slack(word) + 1;
    for (const own of known) { if (Math.abs(own.length - word.length) > 2) continue; const d = distance(word, own, slack(word)); if (d < cost) { cost = d; best = own; } }
    if (best !== word) { intent.fixed = true; intent.read = intent.read.split(" ").map((part) => (part === word ? best : part)).join(" "); }
    return best;
  });
  if (intent.fixed) intent.label = labelOf(intent, intent.read.split(" "));
  const run = (drop: Set<Loosen>) => items.filter((item) => fits(item, intent, drop, typing)).sort((a, b) => score(b, intent) - score(a, intent)).map((item) => item.product);
  if (!norm(query)) return { intent, results: [], exact: true, loosened: [] };
  const drop = new Set<Loosen>();
  let results = run(drop);
  const loosened: string[] = [];
  for (const [what, words] of LOOSEN_ORDER) {
    if (results.length) break;
    const asked = what === "words" ? intent.words.length : what === "colours" ? intent.colours.length : what === "price" ? Number(intent.min !== undefined || intent.max !== undefined) : what === "tags" ? intent.tags.length : what === "gender" ? Number(!!intent.gender) : what === "kinds" ? intent.kinds.length + intent.cats.length : intent.brands.length;
    if (!asked) continue;
    // Words first get a softer try: any one of them, before letting them all go
    if (what === "words" && intent.words.length > 1) {
      const some = items.filter((item) => fits(item, intent, new Set<Loosen>(["words"]), typing) && intent.words.some((word) => wordFits(item, word, typing))).sort((a, b) => score(b, intent) - score(a, intent)).map((item) => item.product);
      if (some.length) { results = some; loosened.push(words); break; }
    }
    drop.add(what);
    loosened.push(words);
    results = run(drop);
  }
  // Only unknown words were asked ("gucci loafers") and none fit: what's trending
  const facets = intent.brands.length + intent.kinds.length + intent.cats.length + intent.colours.length + intent.tags.length + Number(!!intent.gender) + Number(intent.min !== undefined || intent.max !== undefined);
  if (!results.length || (!facets && drop.has("words"))) {
    results = items.filter((item) => item.product.tags?.includes("trending")).map((item) => item.product);
    if (!loosened.includes("everything")) loosened.splice(0, loosened.length, "everything");
  }
  // The price gave way: the nearest prices first
  if (drop.has("price")) results = [...results].sort((a, b) => (intent.max !== undefined ? (a.price ?? 1e9) - (b.price ?? 1e9) : (b.price ?? 0) - (a.price ?? 0)));
  return { intent, results, exact: loosened.length === 0, loosened };
}

let WORDS: Set<string> | null = null;
const shopWords = () => (WORDS ??= new Set(index().flatMap((item) => item.words).filter((word) => word.length > 3 && !/\d/.test(word))));

/** More pieces like a search's, for under a short list: the same brand and type
 *  without the other words (or, for a search by name only, its first piece's) */
export function moreLike(result: SearchResult, max = 12) {
  const { intent } = result;
  const shown = new Set(result.results.map((product) => product.id));
  const first = result.results[0];
  const asked = intent.brands.length + intent.kinds.length + intent.cats.length + Number(!!intent.gender);
  if (!asked && !first) return [];
  const loose: Intent = asked ? { ...intent, words: [], colours: [], tags: [] } : { ...intent, words: [], colours: [], tags: [], brands: [first!.brand], kinds: [first!.kind] };
  return index().filter((item) => !shown.has(item.product.id) && fits(item, loose, new Set(), false)).sort((a, b) => score(b, intent) - score(a, intent)).slice(0, max).map((item) => item.product);
}

/** Words to suggest while typing: brands and types that start like the last word */
export function suggestWords(query: string, max = 6) {
  const last = tokens(query).pop() ?? "";
  if (last.length < 2) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of vocab()) {
    if (entry.facet.type === "stop" || entry.facet.type === "tag") continue;
    for (const word of entry.words) {
      if (word.length < 3 || !(word.startsWith(last) || near(last, word.split(" ")[0]!, true) >= 0)) continue;
      const label = entry.facet.type === "brand" ? entry.label : word;
      if (seen.has(label)) continue;
      seen.add(label);
      out.push(label);
      break;
    }
    if (out.length >= max) break;
  }
  return out;
}
