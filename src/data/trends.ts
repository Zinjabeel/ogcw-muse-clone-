// The Trends page (src/routes/trends.tsx): trending topics from our own
// reporting, trends that went wrong, what people are buying, and videos.
// Everything here is real and sourced; stories link to our coverage, the
// rest to the reports they come from.

const commons = (file: string, width = 1200) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

/** Trending topics: what the desk keeps seeing in its reporting, each with the story that shows it */
export const TREND_TOPICS = [
  { title: "Albums get a second act", note: "New songs added almost a year after release keep a record in the conversation, and on the charts, long after its first week.", slug: "taylor-swift-the-life-of-a-showgirl-the-encore" },
  { title: "Rap’s autumn rush", note: "Drake’s FOMO, a 6 November date from Lil Baby and a GTA VI soundtrack with Future and Yung Lean: the biggest names are all landing before the year-end lists.", slug: "lil-baby-new-album-november-6" },
  { title: "The comeback is a stadium tour", note: "After time away, the biggest acts return at full scale: 88 shows in 34 cities, not a quiet warm-up.", slug: "bts-arirang-world-tour-latin-america" },
  { title: "Charity streams go record-sized", note: "Livestream marathons now raise sums that used to belong to telethons, and the audience keeps growing with them.", slug: "z-event-2026-final-edition" },
  { title: "VTubers lead the launches", note: "Animated creators are no longer a niche: some of the biggest audiences for new games now tune in to a cartoon face.", slug: "wardogs-launch-theburntpeanut" },
  { title: "Big games, bigger waits", note: "Studios are announcing years ahead, with release windows in 2029 and 2030, while fans count down to this year’s giants.", slug: "blizzcon-2026-diablo-v-starcraft" },
] as const;

/** Trends gone wrong: viral moments that got out of hand */
export const TRENDS_GONE_WRONG = [
  {
    when: "August 2026",
    tag: "AI hoax",
    title: "The “Cat in the Hat killer” that never was",
    note: "AI-made clips of Dr Seuss’s cat lurking on Irish streets at night spread on TikTok from Limerick and Wexford, then picked up British place names. Frightened teenagers called their parents, and police in Ireland and South Yorkshire had to say publicly that none of it was real.",
    quote: "“The Cat in the Hat was not in your driveway while you were out.” Wexford Gardaí",
    source: { name: "NME", url: "https://www.nme.com/news/film/viral-cat-in-the-hat-tiktok-trend-3964299" },
  },
  {
    when: "Since 28 September 2026",
    tag: "Games",
    title: "AI “game inside a game” mashups flood the feeds",
    note: "Clips of Minecraft inside Elden Ring and skateboarding in Modern Warfare 2, coded with AI, went viral within days. Most aren’t playable, testers found broken worlds and invisible walls, and the mods reuse other studios’ work without permission. Nexus Mods has tightened its rules on AI content.",
    source: { name: "Ground News roundup (IGN, Kotaku, Forbes)", url: "https://ground.news/article/minecraft-in-elden-ringvibe-coders-are-remixing-video-games-with-ai_ab5203" },
  },
  {
    when: "After the summer peak",
    tag: "Resale",
    title: "Labubu flippers get caught out",
    note: "Resellers who bought Pop Mart’s monsters to sell on watched prices fall: one figure, “Luck”, went from over 500 yuan in June to about 108. Pop Mart says it simply made far more, now around 30 million plush toys a month, and the shares fell about 25% from their August high.",
    quote: "“We can proactively increase supply to ease demand pressure.” Pop Mart’s Sid Si",
    source: { name: "The Standard", url: "https://www.thestandard.com.hk/china/article/314826/Labubu-resale-price-falls-may-be-more-about-supply-than-demand" },
  },
] as const;

/** What people are buying: products everyone is queueing, refreshing or pre-ordering for */
export const TREND_BUYS = [
  {
    tag: "Collectibles",
    title: "Blind boxes beyond Labubu",
    note: "Crybaby, Skullpanda, Hirono and Hacipupu are the Pop Mart lines catching up, and the new look is the plush pendant: a figure with a sturdy loop, made to hang off a bag.",
    photo: { src: commons("Pop Mart Vending Machine in Cerritos, California.jpg"), alt: "A Pop Mart blind-box vending machine in a shopping centre in California", credit: "Thelabubucollector, CC BY 4.0" },
    link: { label: "Read Athlon’s guide", href: "https://athlonsports.com/collectibles/new-pop-mart-collectibles-gaining-labubu-2026-trends" },
  },
  {
    tag: "Sneakers",
    title: "Bad Bunny’s BadBo and the late-September drops",
    note: "The sneaker calendar is stacked: Bad Bunny’s BadBo, a Harden for Rayasianboy and Nike’s Hyperslides all landed in the same week.",
    slug: "sneaker-drops-late-september-2026",
  },
  {
    tag: "Pre-orders",
    title: "Grand Theft Auto VI, and its soundtrack on vinyl",
    note: "The year’s biggest pre-order arrives on 19 November, the same day as a 34-track soundtrack album with limited vinyl and CD sets.",
    slug: "gta-vi-countdown",
  },
  {
    tag: "Consoles",
    title: "A Switch 2 for the holidays",
    note: "Monster Hunter Wilds, Shadow of Mordor and a full September Direct calendar are giving people reasons to pick one up before Christmas.",
    slug: "switch-2-calendar-september-direct",
  },
] as const;

/** Trend videos: official videos behind this season's biggest trends (each opens on YouTube) */
export const TREND_VIDEOS = [
  { id: "xWDfREk0ZLs", title: "Neuro-sama: “Pattern Recognition”", note: "An AI streamer with a single and a live concert booked: VTubers have gone mainstream.", slug: "neuro-sama-pattern-recognition-first-concert" },
  { id: "VQRLujxTm3c", title: "Grand Theft Auto VI: the trailer", note: "The countdown everyone is watching: out on 19 November.", slug: "gta-vi-countdown" },
  { id: "D-gZx4lbGbo", title: "WARDOGS launch", note: "TheBurntPeanut out front as 452,600 people watched it go live.", slug: "wardogs-launch-theburntpeanut" },
  { id: "6OP_KhnmUus", title: "LEGO ONE PIECE", note: "The live-action cast, in minifigure form: the crossover trend reaches Netflix.", slug: "lego-one-piece-netflix" },
] as const;
