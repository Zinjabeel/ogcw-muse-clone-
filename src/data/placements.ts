import { LIST_SLUGS } from "./content";

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
  /** A list used around the site rather than a spot on the front page: it may repeat stories shown elsewhere */
  list?: boolean;
};

export const SLOTS = [
  // The hero: the visitor's choice of three; Gallery shows no stories
  // (The hero's stories take turns, so they may also show further down the page)
  { id: "hero-cover", area: "Hero", name: "Cover stories", note: "Take turns as the big story in the Cover hero, 3 seconds each", max: 6, defaults: ["taylor-swift-the-life-of-a-showgirl-the-encore", "vmas-2026-winners", "bts-arirang-world-tour-latin-america", "paris-fashion-week-ss27", "gta-vi-countdown", "z-event-2026-final-edition"], list: true },
  { id: "hero-cover-rail", area: "Hero", name: "Also on OGCW", note: "Take turns in the three places under the cover story", max: 8, defaults: ["gta-vi-countdown", "z-event-2026-final-edition", "emmys-2026-winners", "tokyo-game-show-2026-typhoon", "kai-cenat-ishowspeed-minecraft-marathon", "latin-grammys-2026-nominations", "blizzcon-2026-diablo-v-starcraft", "avengers-endgame-encore-box-office"], list: true },
  { id: "hero-top", area: "Hero", name: "Top stories", note: "The stories that take turns in the Gallery 2 hero", max: 3, defaults: ["gta-vi-countdown", "paris-fashion-week-ss27", "taylor-swift-the-life-of-a-showgirl-the-encore"], list: true },

  // OGCW News, the front under the hero
  { id: "front-lead", area: "OGCW News", name: "Main story", note: "The big story in the middle", max: 1, defaults: ["vmas-2026-winners"] },
  { id: "front-secondary", area: "OGCW News", name: "Beside the main story", note: "Two stories with photos", max: 2, defaults: ["gta-vi-countdown", "paris-fashion-week-ss27"] },
  { id: "front-side", area: "OGCW News", name: "Down the side", note: "Three stories in the side column", max: 3, defaults: ["bts-arirang-world-tour-latin-america", "avengers-endgame-encore-box-office", "neuro-sama-pattern-recognition-first-concert"] },

  // This week
  { id: "week-lead", area: "This week", name: "Lead story", note: "The big story on the left", max: 1, defaults: ["lil-baby-new-album-november-6"] },
  { id: "week-thread", area: "This week", name: "Under the lead", note: "Three small stories under the lead", max: 3, defaults: ["dior-ss27-jonathan-anderson", "drake-solar-eclipse-choosin-texas-publishing", "milan-fashion-week-ss27-review"] },
  { id: "week-middle", area: "This week", name: "Middle column", note: "Two stories with photos", max: 2, defaults: ["lcd-soundsystem-nyc-residency-100th-show", "yung-lean-thats-it-gta-vi-future-metro-boomin"] },
  { id: "week-connected", area: "This week", name: "Connected story", note: "Linked under the first story in the middle column", max: 1, defaults: ["al-doyle-hollywood-saviour"] },
  { id: "week-brief", area: "This week", name: "In brief", note: "Five short items, numbered", max: 5, defaults: ["xbox-disc-to-digital-all-players", "grasshopper-manufacture-leaves-netease", "kick-partner-program-payout-fix", "wwe-main-event-moves-to-rumble", "dennis-haskins-dies"] },
  { id: "week-cluster", area: "This week", name: "Big news", note: "Three places, each fading between two stories every few seconds", max: 6, defaults: ["qobuz-ai-music-tags", "sony-music-joins-ariam", "professional-sound-alliance-launch", "rap-number-ones-2026", "neuro-sama-pattern-recognition-first-concert", "lil-durk-not-guilty-murder-for-hire"], list: true },

  // Explore and Keep exploring, at the end of the front page
  { id: "explore-pick", area: "Explore", name: "Editor’s pick", note: "The big tile in Explore", max: 1, defaults: ["tokyo-game-show-2026-typhoon"] },
  { id: "trending", area: "Explore", name: "Trending now", note: "In Explore, the menu and the Trends page", max: 5, defaults: LIST_SLUGS.trending, list: true },
  { id: "kx-feature", area: "Keep exploring", name: "Big story", note: "The first big tile", max: 1, defaults: ["witcher-3-remastered-launch"] },
  { id: "kx-tiles", area: "Keep exploring", name: "Four stories", note: "The tiles beside the big story", max: 4, defaults: ["minecraft-dungeons-ii-launch", "epic-fortnite-dutch-class-action", "build-a-rocket-boy-administration", "kai-cenat-ishowspeed-minecraft-marathon"] },
  { id: "kx-rap", area: "Keep exploring", name: "On the rap beat", note: "Four stories beside the rap vote", max: 4, defaults: ["rap-number-ones-2026", "lil-durk-not-guilty-murder-for-hire", "keffe-d-guilty-tupac-shakur-murder", "jhene-aiko-westside-whimsy-number-one"] },
  { id: "kx-more-feature", area: "Keep exploring", name: "More to explore: big story", note: "The second big tile", max: 1, defaults: ["monster-hunter-wilds-switch-2"] },
  { id: "kx-more-tiles", area: "Keep exploring", name: "More to explore: four stories", note: "The tiles beside the second big story", max: 4, defaults: ["switch-2-calendar-september-direct", "shadow-of-mordor-shadow-of-war-switch-2", "ea-sports-fc-27-launch", "october-2026-games"] },
  { id: "kx-screens", area: "Keep exploring", name: "Screens & streams", note: "Three quick reads in a list", max: 3, defaults: ["netflix-october-2026", "streamer-awards-2026-applications", "made-on-youtube-2026"] },
  { id: "kx-more-end", area: "Keep exploring", name: "Last two stories", note: "The two tall tiles at the end", max: 2, defaults: ["intergalactic-quiet-until-2027", "dawn-of-war-iv-space-marines-trailer"] },

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
