import { LIST_SLUGS, type SectionId } from "./content";

// Where stories show on the site besides the News page and their own page:
// every spot on the front page that holds stories, and the lists used
// around the site. In the studio, "Where it appears" (src/sanity/placements.tsx)
// puts a story in any of them; the choices are kept in Sanity's "Front page"
// document, and the site reads them with resolveSlots below.
//
// Each spot shows, in order: the stories placed there (published ones only,
// so a new story shows up the moment it's published), then its usual
// stories (`defaults`), then the newest stories not already on the front
// page. A story set to "News page only" is left out of all of that, unless
// it's placed in a spot by hand.

export type SlotDef = {
  id: string;
  area: string;
  name: string;
  note: string;
  max: number;
  defaults: string[];
  /** Empty places are filled only with stories from this section */
  section?: SectionId;
  /** A list used around the site rather than a spot on the front page: it may repeat stories shown elsewhere */
  list?: boolean;
};

export const SLOTS = [
  // The hero: the visitor's choice of three; Gallery shows no stories
  // (The hero's stories take turns, so they may also show further down the page)
  { id: "hero-cover", area: "Hero", name: "Cover stories", note: "Take turns as the big story in the Cover hero, 3 seconds each", max: 6, defaults: ["taylor-swift-the-life-of-a-showgirl-the-encore", "vmas-2026-winners", "bts-arirang-world-tour-latin-america", "paris-fashion-week-ss27", "gta-vi-countdown", "z-event-2026-final-edition"], list: true },
  { id: "hero-cover-rail", area: "Hero", name: "Also on OGCW", note: "Take turns in the three places under the cover story", max: 8, defaults: ["gta-vi-countdown", "z-event-2026-final-edition", "emmys-2026-winners", "tokyo-game-show-2026-typhoon", "kai-cenat-ishowspeed-minecraft-marathon", "latin-grammys-2026-nominations", "blizzcon-2026-diablo-v-starcraft", "avengers-endgame-encore-box-office"], list: true },
  { id: "hero-top", area: "Hero", name: "Top stories", note: "The stories that take turns in the Gallery 2 hero", max: 3, defaults: ["gta-vi-countdown", "paris-fashion-week-ss27", "taylor-swift-the-life-of-a-showgirl-the-encore"], list: true },

  // The Wire, the first band under the hero
  { id: "front-lead", area: "The Wire", name: "Main story", note: "The big story at the top of the front page", max: 1, defaults: ["vmas-2026-winners"] },
  { id: "wire-latest", area: "The Wire", name: "Just in", note: "Five numbered stories beside the main story in Explore; empty places take the newest stories not placed anywhere else", max: 5, defaults: [] },

  // The week
  { id: "week-lead", area: "The week", name: "Lead story", note: "The big story on the left", max: 1, defaults: ["lil-baby-new-album-november-6"] },
  { id: "week-thread", area: "The week", name: "Under the lead", note: "Three small stories under the lead", max: 3, defaults: ["dior-ss27-jonathan-anderson", "drake-solar-eclipse-choosin-texas-publishing", "milan-fashion-week-ss27-review"] },
  { id: "week-middle", area: "The week", name: "Middle column", note: "Two stories with photos", max: 2, defaults: ["jay-z-30-tour-sofi-finale", "ye-st-petersburg-gazprom-arena"] },
  { id: "week-connected", area: "The week", name: "Connected story", note: "Linked under the first story in the middle column", max: 1, defaults: ["dave-raindance-year"] },
  { id: "week-brief", area: "The week", name: "In brief", note: "Five short items, numbered", max: 5, defaults: ["xbox-disc-to-digital-all-players", "grasshopper-manufacture-leaves-netease", "kick-partner-program-payout-fix", "wwe-main-event-moves-to-rumble", "dennis-haskins-dies"] },
  { id: "week-cluster", area: "The week", name: "Big news", note: "Three places, each fading between two stories every few seconds", max: 6, defaults: ["qobuz-ai-music-tags", "sony-music-joins-ariam", "professional-sound-alliance-launch", "mercury-prize-2026-shortlist", "emmys-2026-winners", "venice-2026-woman-unknown-golden-lion"] },

  // The rap desk
  { id: "rap-spotlight", area: "Rap desk", name: "Spotlight", note: "The big story on the rap desk", max: 1, defaults: ["yung-lean-thats-it-gta-vi-future-metro-boomin"], section: "music" },
  { id: "rap-beat", area: "Rap desk", name: "On the rap beat", note: "Two headlines under the spotlight in Explore", max: 2, defaults: ["quavo-qromelife-pharrell", "anderson-paak-cordae-heavy-is-the-crown"], section: "music" },

  // The OGCW 10
  { id: "ranking", area: "The OGCW 10", name: "The ranking", note: "Five stories, ranked: the order here is the order on the page", max: 5, defaults: ["gta-vi-countdown", "bts-arirang-world-tour-latin-america", "paris-fashion-week-ss27", "avengers-endgame-encore-box-office", "drake-iceman-top-three-fomo", "marvels-wolverine-sales", "z-event-2026-final-edition", "latin-grammys-2026-nominations", "tokyo-game-show-2026-typhoon", "onimusha-way-of-the-sword-launch"] },

  // The sports desk
  { id: "sports-lead", area: "Sports desk", name: "Main story", note: "The big story on the sports desk", max: 1, defaults: ["nba-2026-27-opening-night"], section: "sports" },
  { id: "sports-more", area: "Sports desk", name: "More sports", note: "Two headlines under it", max: 2, defaults: ["ballon-dor-2026-london", "athletes-fashion-month-2026"], section: "sports" },

  // Games & streaming
  { id: "games-lead", area: "Games & streaming", name: "Games: main story", note: "The big games story", max: 1, defaults: ["october-2026-games"], section: "games" },
  { id: "games-more", area: "Games & streaming", name: "Games: more", note: "Two headlines under it", max: 2, defaults: ["witcher-3-remastered-launch", "switch-2-calendar-september-direct"], section: "games" },
  { id: "streaming-lead", area: "Games & streaming", name: "Streaming: main story", note: "The big streaming story", max: 1, defaults: ["kai-cenat-vivet-nyfw"], section: "streaming" },
  { id: "streaming-more", area: "Games & streaming", name: "Streaming: more", note: "Two headlines under it", max: 2, defaults: ["twitchcon-san-diego-2026", "worlds-2026-north-america"], section: "streaming" },

  // Culture & fashion
  { id: "culture-lead", area: "Culture & fashion", name: "Main story", note: "The big culture story", max: 1, defaults: ["courreges-drew-henry-debut"], section: "culture" },
  { id: "culture-more", area: "Culture & fashion", name: "More culture", note: "Four stories beside it", max: 4, defaults: ["saint-laurent-ss27-vaccarello", "sneaker-drops-late-september-2026", "lego-one-piece-netflix", "coyote-vs-acme-digital-release"], section: "culture" },

  // The Explore page (not the front page, so its stories may show elsewhere)
  { id: "explore-pick", area: "Explore page", name: "Editor’s pick", note: "The big tile on the Explore page", max: 1, defaults: ["tokyo-game-show-2026-typhoon"], list: true },
  { id: "trending", area: "Explore page", name: "Trending now", note: "On the Explore page, in the menu and on the Trends page", max: 5, defaults: LIST_SLUGS.trending, list: true },
  // Lists around the site
  { id: "most-read", area: "Around the site", name: "Most read", note: "Beside every story and in search", max: 5, defaults: LIST_SLUGS.mostRead, list: true },
  { id: "editors-picks", area: "Around the site", name: "Editors’ picks", note: "In the menu", max: 5, defaults: LIST_SLUGS.editorsPicks, list: true },
] as const satisfies readonly SlotDef[];

export type SlotId = (typeof SLOTS)[number]["id"];
export const SLOT_BY_ID = Object.fromEntries(SLOTS.map((slot) => [slot.id, slot])) as Record<SlotId, SlotDef>;
export const isSlotId = (id: string): id is SlotId => id in SLOT_BY_ID;

/** What's in Sanity's Front page document: the stories placed in each spot (in order) and the ones kept off the front page */
export type FrontLayout = { slots: Partial<Record<SlotId, string[]>>; hidden: string[] };
export const EMPTY_LAYOUT: FrontLayout = { slots: {}, hidden: [] };

/** True when a spot shows its usual stories (the ones written for it), so it can keep its own headings */
export const isDefault = (id: SlotId, shown: { slug: string }[]) => {
  const defaults = SLOT_BY_ID[id].defaults;
  return shown.length === defaults.length && shown.every((story, index) => story.slug === defaults[index]);
};

/**
 * The stories each spot shows. `all` is every published story, newest first;
 * anything not in it (unpublished, deleted) is skipped.
 */
export function resolveSlots<T extends { slug: string }>(all: T[], layout: FrontLayout): Record<SlotId, T[]> {
  const bySlug = new Map(all.map((story) => [story.slug, story]));
  const hidden = new Set(layout.hidden);
  const onFront = new Set<string>();
  // The stories placed in or usual for every spot: an empty place is filled
  // with others first, so a story doesn't show twice on the page
  const usual = new Set((SLOTS as readonly SlotDef[]).flatMap((slot) => (slot.list ? [] : [...(layout.slots[slot.id as SlotId] ?? []), ...slot.defaults])));
  const result = {} as Record<SlotId, T[]>;
  for (const slot of SLOTS as readonly SlotDef[]) {
    const placed = layout.slots[slot.id as SlotId] ?? [];
    const shown: T[] = [];
    const take = (slug: string, byHand: boolean) => {
      const story = bySlug.get(slug);
      if (!story || shown.length >= slot.max || shown.includes(story) || (!byHand && hidden.has(slug))) return;
      if (!byHand && slot.section && (story as { section?: string }).section !== slot.section) return;
      shown.push(story);
    };
    placed.forEach((slug) => take(slug, true));
    slot.defaults.forEach((slug) => take(slug, false));
    // Still room: the newest stories not already on the front page (nor
    // waiting to be, in a spot further down), then any not already on it
    for (const pass of [true, false]) {
      for (const story of all) {
        if (shown.length >= slot.max) break;
        if (slot.list || (!onFront.has(story.slug) && !(pass && usual.has(story.slug)))) take(story.slug, false);
      }
    }
    if (!slot.list) shown.forEach((story) => onFront.add(story.slug));
    result[slot.id as SlotId] = shown;
  }
  return result;
}
