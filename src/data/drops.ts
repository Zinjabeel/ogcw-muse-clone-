// Drops: the release calendar on the front page (sneakers, music, games,
// film) and the big nights coming up (awards, shows, games) that The Wire
// lists. Every date comes from the source named beside it, or from the OGCW
// story it links to. Past dates drop off by themselves.

export type DropKind = "Sneakers" | "Music" | "Games" | "Film";
export type Drop = {
  date: string; // ISO day
  kind: DropKind;
  name: string;
  detail: string;
  /** The OGCW story about it */
  slug?: string;
  /** Where the date comes from, when no story covers it */
  source?: { name: string; url: string };
};

const KICKS = { name: "Just Fresh Kicks: Air Jordan release dates (updated 5 Oct 2026)", url: "https://justfreshkicks.com/air-jordan-release-dates/" };

export const DROPS: Drop[] = [
  { date: "2026-10-06", kind: "Games", name: "Gears of War: E-Day", detail: "Xbox Series X|S and PC, on Game Pass at launch", slug: "october-2026-games" },
  { date: "2026-10-10", kind: "Sneakers", name: "Air Jordan 1 High OG “Royal”", detail: "$185", source: KICKS },
  { date: "2026-10-16", kind: "Film", name: "Whalefall", detail: "20th Century Studios, in cinemas" },
  { date: "2026-10-17", kind: "Sneakers", name: "Air Jordan 5 “Halloween”", detail: "$215", source: KICKS },
  { date: "2026-10-20", kind: "Games", name: "Hearthstone: Reign of the Black Empire", detail: "The expansion announced at BlizzCon", slug: "blizzcon-2026-diablo-v-starcraft" },
  { date: "2026-10-23", kind: "Games", name: "Call of Duty: Modern Warfare 4", detail: "PS5, Xbox, PC and, for the first time, Switch 2", slug: "october-2026-games" },
  { date: "2026-10-23", kind: "Film", name: "Klara and the Sun", detail: "Taika Waititi adapts Kazuo Ishiguro" },
  { date: "2026-10-23", kind: "Music", name: "Anderson .Paak & Cordae: Heavy Is the Crown", detail: "Their joint album, with J. Cole and 9th Wonder in the credits", slug: "anderson-paak-cordae-heavy-is-the-crown" },
  { date: "2026-10-24", kind: "Sneakers", name: "Air Jordan 12 “Egg Nog”", detail: "$215", source: KICKS },
  { date: "2026-10-25", kind: "Sneakers", name: "Air Jordan 41 “University Red”", detail: "$205", source: KICKS },
  { date: "2026-10-29", kind: "Games", name: "Phantom Blade Zero", detail: "PS5 and PC", slug: "october-2026-games" },
  { date: "2026-10-31", kind: "Sneakers", name: "Air Jordan 14 “Forest Green”", detail: "$215", source: KICKS },
  { date: "2026-10-31", kind: "Sneakers", name: "Air Jordan 4 “Light Army”", detail: "$220", source: KICKS },
  { date: "2026-11-04", kind: "Games", name: "World of Warcraft: Forever", detail: "Blizzard’s new way to play", slug: "blizzcon-2026-diablo-v-starcraft" },
  { date: "2026-11-06", kind: "Music", name: "Lil Baby’s new album", detail: "The date he posted; title still to come", slug: "lil-baby-new-album-november-6" },
  { date: "2026-11-06", kind: "Film", name: "The Cat in the Hat", detail: "Warner Bros.’ animated musical" },
  { date: "2026-11-07", kind: "Sneakers", name: "Air Jordan 6 “White Infrared”", detail: "$215", source: KICKS },
  { date: "2026-11-07", kind: "Sneakers", name: "Air Jordan 15 and 17 Low “Black Pack”", detail: "$240 each", source: KICKS },
  { date: "2026-11-11", kind: "Sneakers", name: "Air Jordan 11 “Lapis” (women’s)", detail: "$235", source: KICKS },
  { date: "2026-11-14", kind: "Sneakers", name: "Air Jordan 11 “Green Screen”", detail: "$255", source: KICKS },
  { date: "2026-11-19", kind: "Games", name: "Grand Theft Auto VI", detail: "PS5 and Xbox Series X|S, at midnight", slug: "gta-vi-countdown" },
  { date: "2026-11-19", kind: "Music", name: "The GTA VI soundtrack album", detail: "34 tracks, with Future, Travis Scott and Yung Lean", slug: "yung-lean-thats-it-gta-vi-future-metro-boomin" },
  { date: "2026-11-20", kind: "Film", name: "The Hunger Games: Sunrise on the Reaping", detail: "Haymitch’s Games, in cinemas" },
  { date: "2026-11-21", kind: "Sneakers", name: "Air Jordan 3 “Not Nice”", detail: "$215", source: KICKS },
  { date: "2026-11-25", kind: "Film", name: "Hexe", detail: "Disney’s original animated film" },
  { date: "2026-11-27", kind: "Sneakers", name: "Air Jordan 4 “Bred”", detail: "$230", source: KICKS },
  { date: "2026-12-04", kind: "Games", name: "Monster Hunter Wilds on Switch 2", detail: "Capcom’s hunt goes portable", slug: "monster-hunter-wilds-switch-2" },
  { date: "2026-12-05", kind: "Sneakers", name: "Air Jordan 10 “Sacramento”", detail: "$215", source: KICKS },
  { date: "2026-12-12", kind: "Sneakers", name: "Air Jordan 11 “Space Jam”", detail: "$235", source: KICKS },
  { date: "2026-12-18", kind: "Film", name: "Avengers: Doomsday", detail: "Marvel’s next Avengers film" },
  { date: "2026-12-19", kind: "Sneakers", name: "Air Jordan 4 “Pink Thunder”", detail: "$220", source: KICKS },
  { date: "2026-12-24", kind: "Sneakers", name: "Air Jordan 8 “Knicks”", detail: "$215", source: KICKS },
  { date: "2026-12-26", kind: "Sneakers", name: "Air Jordan 4 “BIN 23”", detail: "$355", source: KICKS },
];

// The big nights coming up, for The Wire's "Coming up" rail
export type Night = { date: string; end?: string; tag: string; name: string; detail: string; slug?: string };
export const NIGHTS: Night[] = [
  { date: "2026-10-10", end: "2026-10-11", tag: "Live", name: "Ye in St Petersburg", detail: "Two nights at Gazprom Arena", slug: "ye-st-petersburg-gazprom-arena" },
  { date: "2026-10-13", tag: "Live", name: "Trueno at Palau Sant Jordi", detail: "El Último Baile in Barcelona", slug: "trueno-el-ultimo-baile-spain" },
  { date: "2026-10-20", tag: "Sports", name: "NBA opening night", detail: "The Knicks raise their banner", slug: "nba-2026-27-opening-night" },
  { date: "2026-10-22", tag: "Awards", name: "Mercury Prize 2026", detail: "Named live in Newcastle", slug: "mercury-prize-2026-shortlist" },
  { date: "2026-10-23", end: "2026-10-24", tag: "Live", name: "Jay-Z at SoFi Stadium", detail: "The JAY-Z 30 Tour finale", slug: "jay-z-30-tour-sofi-finale" },
  { date: "2026-10-26", tag: "Sports", name: "Ballon d’Or", detail: "In London, for the first time", slug: "ballon-dor-2026-london" },
  { date: "2026-11-12", tag: "Awards", name: "The Streamer Awards 2026", detail: "Streaming’s big night, in Los Angeles", slug: "streamer-awards-2026-applications" },
  { date: "2026-11-13", end: "2026-11-15", tag: "Streaming", name: "TwitchCon San Diego", detail: "Three days at the convention center", slug: "twitch-state-of-gaming-2026" },
  { date: "2026-12-10", tag: "Awards", name: "The Game Awards 2026", detail: "Live from the Peacock Theater" },
  { date: "2026-12-11", tag: "Sports", name: "NBA Cup final", detail: "Hinkle Fieldhouse, Indianapolis", slug: "nba-2026-27-opening-night" },
  { date: "2026-12-19", tag: "Live", name: "Neuro-sama & Evil Neuro live", detail: "The AI twins’ first concert", slug: "neuro-sama-pattern-recognition-first-concert" },
  { date: "2026-12-25", tag: "Sports", name: "NBA on Christmas Day", detail: "Five games, Knicks v Spurs in New York", slug: "nba-2026-27-opening-night" },
];

// Watch: official videos from the artists, studios and channels in our
// stories (OGCW has no videos of its own yet). Each plays from YouTube.
export type Video = { id: string; title: string; channel: string; kind: string; slug: string };
export const VIDEOS: Video[] = [
  { id: "OlmuIckOX0c", title: "The Witcher 3: Wild Hunt Remastered launch trailer", channel: "CD Projekt Red", kind: "Trailer", slug: "witcher-3-remastered-launch" },
  { id: "VQRLujxTm3c", title: "Grand Theft Auto VI: Trailer 2", channel: "Rockstar Games", kind: "Trailer", slug: "gta-vi-countdown" },
  { id: "xWDfREk0ZLs", title: "Pattern Recognition (official video)", channel: "Neuro-sama x ODDEEO", kind: "Music video", slug: "neuro-sama-pattern-recognition-first-concert" },
  { id: "3ot6jdgtp4o", title: "Call of Duty: Modern Warfare 4 reveal", channel: "Xbox", kind: "Trailer", slug: "october-2026-games" },
  { id: "nI17NM1UcJQ", title: "East of Eden: the opening scene", channel: "Netflix", kind: "Clip", slug: "netflix-october-2026" },
  { id: "6OP_KhnmUus", title: "LEGO ONE PIECE trailer", channel: "ONE PIECE Official", kind: "Trailer", slug: "lego-one-piece-netflix" },
];
