// OGCW content library: every story, Originals episode, streamer, song and
// shop on the site. Pages, the home page, the header menu, the drawer, search
// and the footer all read from here, so a story added once shows up
// everywhere it should.
// Stories are real news from September 2026, written in OGCW's own words,
// each with the reporting it is based on listed under "sources".
// TODO: this becomes the admin panel / CMS later.
import taylorPhoto from "../assets/news/taylor-swift-eras-london.jpg";
import madonnaPhoto from "../assets/news/madonna-celebration-tour.jpg";
import btsSwimPhoto from "../assets/news/bts-arirang-paris-swim.jpg";
import btsStadiumPhoto from "../assets/news/bts-arirang-paris-stadium.jpg";
import tgsPhoto from "../assets/news/tokyo-game-show-2026.jpg";
import blizzconPhoto from "../assets/news/blizzcon-anaheim.jpg";
import zeratorPhoto from "../assets/news/zerator-zevent.jpg";
import twitchconPhoto from "../assets/news/twitchcon-block-party.jpg";
import runwayPhoto from "../assets/news/runway-mcqueen.jpg";
import wylePhoto from "../assets/news/noah-wyle.jpg";
import barbicanPhoto from "../assets/news/barbican-lakeside.jpg";
import mileyPhoto from "../assets/news/miley-cyrus-primavera.jpg";
import skarsgardPhoto from "../assets/news/bill-skarsgard.jpg";
import speedPhoto from "../assets/news/ishowspeed-singapore.jpg";
import venicePhoto from "../assets/news/venice-red-carpet.jpg";
import niaPhoto from "../assets/news/nia-archives.jpg";
import kendrickPhoto from "../assets/news/kendrick-lamar.jpg";
import drakePhoto from "../assets/news/drake-summer-sixteen.jpg";
import colePhoto from "../assets/news/j-cole-2010.jpg";
import coleArenaPhoto from "../assets/news/j-cole-arena.jpg";
import futurePhoto from "../assets/news/future-2014.jpg";
import cardiPhoto from "../assets/news/cardi-b-vma.jpg";
import durkPhoto from "../assets/news/lil-durk.jpg";
import tupacStarPhoto from "../assets/news/tupac-shakur-star.jpg";
import jhenePhoto from "../assets/news/jhene-aiko.jpg";
import kaiPhoto from "../assets/news/kai-cenat.jpg";
import benziesPhoto from "../assets/news/leslie-benzies.jpg";
import fortnitePhoto from "../assets/news/fortnite-gdc.jpg";
import { unsplash, youtubeThumb, youtubeUrl } from "./media";
import { STORY_BODIES } from "./stories";

export type Crop = { pos: string; zoom?: number };
export type Photo = { src: string; alt: string; credit?: string; crop?: Crop };
export type Source = { name: string; url: string };

export type SectionId = "music" | "games" | "streaming" | "culture";
export const SECTIONS: Record<SectionId, { label: string; intro: string }> = {
  music: { label: "Music", intro: "New releases, tours and the awards nights everyone is talking about." },
  games: { label: "Games", intro: "Launches, sales and the showcases setting up the next few years of play." },
  streaming: { label: "Streaming", intro: "The creators, records and charity marathons that live on Twitch, YouTube and Kick." },
  culture: { label: "Culture", intro: "Fashion weeks, television, sneakers and the shows shaping the season." },
};
export const SECTION_IDS = Object.keys(SECTIONS) as SectionId[];

// What a story's body is made of: paragraphs, subheads, pull quotes, photos
// (one, or two side by side), bullet lists, a key-facts box, a checklist
// ("what to prepare") and questions and answers.
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; photo: Photo; caption: string }
  | { type: "images"; photos: [Photo, Photo]; caption: string }
  | { type: "list"; items: string[] }
  | { type: "facts"; title: string; items: [string, string][] }
  | { type: "checklist"; title: string; items: string[] }
  | { type: "faq"; items: [string, string][] }
  | { type: "link"; label: string; href: string };

export type Article = {
  slug: string;
  section: SectionId;
  kicker: string;
  title: string;
  deck: string;
  author: string;
  date: string; // ISO
  read: string;
  photo: Photo;
  body: Block[];
  sources: Source[];
  ask?: string; // the yes/no question at the end ("Are you going?"); "Was this helpful?" when unset
};

export { youtubeThumb, youtubeUrl, spotifyTrack } from "./media";

// Words in a story, for its reading time (about 230 a minute)
const blockWords = (block: Block): string[] => {
  switch (block.type) {
    case "p": case "h2": case "quote": return [block.text];
    case "image": case "images": return [block.caption];
    case "list": return block.items;
    case "facts": return [block.title, ...block.items.flat()];
    case "checklist": return [block.title, ...block.items];
    case "faq": return block.items.flat();
    case "link": return [];
  }
};
export const wordCount = (body: Block[]) => body.flatMap(blockWords).join(" ").split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------- Stories (newest first)
// Each story's details are here; its full text lives in src/data/stories,
// one file per section, and its reading time is worked out from that text.

const RAW_ARTICLES: Omit<Article, "body" | "read">[] = [
  {
    slug: "rap-number-ones-2026",
    section: "music",
    kicker: "The rap desk",
    title: "Five rappers, five number ones: hip-hop’s 2026 so far",
    deck: "A record Grammy night, three albums in the top three at once and a 12th number one. The case for each name in our No. 1 rapper vote.",
    author: "Sana Lind",
    date: "2026-09-30",
    photo: { src: coleArenaPhoto, alt: "J. Cole on stage in a packed arena under white spotlights", credit: "The Come Up Show, CC BY 2.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "XXL: Kendrick Lamar’s GNX wins Best Rap Album at the 2026 Grammys", url: "https://www.xxlmag.com/kendrick-lamar-gnx-best-rap-album-2026-grammy-awards/" },
      { name: "HotNewHipHop: Drake tops the Billboard 200 with the ICEMAN trilogy", url: "https://www.hotnewhiphop.com/996118-drake-tops-billboard-200-iceman-trilogy-first-week-sales" },
      { name: "The Source: Future scores his 12th No. 1 album with The Real Me", url: "https://thesource.com/2026/07/21/future-the-real-me-billboard-200-number-one/" },
      { name: "Wikipedia: 2026 in hip-hop", url: "https://en.wikipedia.org/wiki/2026_in_hip-hop" },
    ],
  },
  {
    slug: "bts-arirang-world-tour-latin-america",
    section: "music",
    kicker: "Live",
    title: "BTS take the Arirang World Tour to Latin America",
    deck: "After a Song of the Year win at the VMAs, the stadium tour heads to Bogotá, Lima, Santiago, La Plata and São Paulo through October.",
    author: "Nia Vale",
    date: "2026-09-29",
    photo: { src: btsSwimPhoto, alt: "BTS performing “Swim” to a full stadium in Paris", credit: "Chiyako92, CC BY-SA 4.0", crop: { pos: "50% 45%" } },
    sources: [
      { name: "Wikipedia: Arirang World Tour", url: "https://en.wikipedia.org/wiki/Arirang_World_Tour" },
      { name: "Wikipedia: Swim (BTS song)", url: "https://en.wikipedia.org/wiki/Swim_(BTS_song)" },
    ],
  },
  {
    slug: "gta-vi-countdown",
    section: "games",
    kicker: "Countdown",
    title: "Fifty-one days to GTA VI: what we know before launch",
    deck: "Rockstar’s return to Vice City is on track for 19 November on PS5 and Xbox Series X|S. Pre-orders are open; a PC date is not.",
    author: "Jonah Reyes",
    date: "2026-09-29",
    photo: { src: youtubeThumb("VQRLujxTm3c"), alt: "Official Grand Theft Auto VI artwork: Jason and Lucia on a dock in Vice City", credit: "Rockstar Games, Trailer 2", crop: { pos: "50% 40%" } },
    sources: [
      { name: "PCGamesN: GTA 6 release date and latest news", url: "https://www.pcgamesn.com/grand-theft-auto-vi/gta-6-release-date-setting-map-characters-gameplay-trailers" },
      { name: "Beebom: When will GTA 6 Trailer 3 come out?", url: "https://beebom.com/when-will-gta-6-trailer-3-come-out/" },
      { name: "Rockstar Games: Grand Theft Auto VI Trailer 2", url: "https://www.youtube.com/watch?v=VQRLujxTm3c" },
    ],
  },
  {
    slug: "witcher-3-remastered-launch",
    section: "games",
    kicker: "Launch",
    title: "The Witcher 3 Remastered is out, and it’s free if you own the game",
    deck: "CD Projekt Red’s overhaul arrived on 29 September with new combat, a revamped skill tree and both expansions free for current owners.",
    author: "Jonah Reyes",
    date: "2026-09-29",
    photo: { src: youtubeThumb("OlmuIckOX0c"), alt: "A scene from the official launch trailer for The Witcher 3: Wild Hunt — Remastered", credit: "CD Projekt Red, official launch trailer", crop: { pos: "50% 16%", zoom: 1.35 } },
    sources: [
      { name: "CD Projekt Red: The Witcher 3: Wild Hunt — Remastered announced", url: "https://press.cdprojektred.com/en/news/1839/the-witcher-3-wild-hunt-remastered-announced-songs-of-the-past-gets-first-look" },
      { name: "YouTube: The Witcher 3: Wild Hunt — Remastered, official launch trailer", url: youtubeUrl("OlmuIckOX0c") },
    ],
  },
  {
    slug: "minecraft-dungeons-ii-launch",
    section: "games",
    kicker: "Launch",
    title: "Minecraft Dungeons II is out, and it takes you into the Sift",
    deck: "Mojang and Double Eleven’s sequel launched on 29 September with four-player co-op, a new dimension and a lot more loot, from €29.99.",
    author: "Nia Vale",
    date: "2026-09-29",
    photo: { src: youtubeThumb("nHW7oH_kZd4"), alt: "A scene from the official launch trailer for Minecraft Dungeons II", credit: "Mojang Studios, official launch trailer", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Steam: Minecraft Dungeons II", url: "https://store.steampowered.com/app/1912410/Minecraft_Dungeons_II/" },
      { name: "YouTube: Minecraft Dungeons II, official launch trailer", url: youtubeUrl("nHW7oH_kZd4") },
    ],
  },
  {
    slug: "vmas-2026-winners",
    section: "music",
    kicker: "Awards",
    title: "VMAs 2026: Swift takes Video of the Year as Madonna wins seven",
    deck: "Madonna was named Artist of the Year, BTS won Song of the Year and the show drew its biggest audience since 2015.",
    author: "Jonah Reyes",
    date: "2026-09-28",
    photo: { src: madonnaPhoto, alt: "Madonna on stage during The Celebration Tour, dancers and screens around her", credit: "Ronald Woan, CC BY 4.0", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Wikipedia: 2026 MTV Video Music Awards", url: "https://en.wikipedia.org/wiki/2026_MTV_Video_Music_Awards" },
      { name: "The Hollywood Reporter: MTV VMAs 2026 winners list", url: "https://www.hollywoodreporter.com/lists/mtv-vmas-2026-winners-list/" },
    ],
  },
  {
    slug: "paris-fashion-week-ss27",
    section: "culture",
    kicker: "Fashion",
    title: "Paris Fashion Week opens its biggest season: the shows to watch",
    deck: "Around 100 houses show spring/summer 2027 between 28 September and 6 October, with debuts at Courrèges and Carven.",
    author: "Sana Lind",
    date: "2026-09-28",
    photo: { src: runwayPhoto, alt: "Models walking the runway at an Alexander McQueen show, seen from behind", credit: "Christopher Macsurak, CC BY 2.0", crop: { pos: "50% 35%" } },
    sources: [
      { name: "Luxury.it: Paris Fashion Week SS27", url: "https://luxury.it/fashion/paris-fashion-week-ss27/" },
      { name: "Fédération de la Haute Couture et de la Mode: Paris Fashion Week", url: "https://www.fhcm.paris/en/paris-fashion-week" },
    ],
  },
  {
    slug: "avengers-endgame-encore-box-office",
    section: "culture",
    kicker: "Box office",
    title: "Avengers: Endgame is number one again, seven years on",
    deck: "The Encore re-release took $26.1 million to top the US box office, the first re-release to do it since The Lion King in 2011.",
    author: "Jonah Reyes",
    date: "2026-09-28",
    photo: { src: unsplash("photo-1489599849927-2ee91cede3ba", 1600), alt: "Rows of red seats in a dark cinema", credit: "Unsplash", crop: { pos: "50% 60%" } },
    sources: [
      { name: "Wikipedia: 2026 box office number-one films in the United States", url: "https://en.wikipedia.org/wiki/List_of_2026_box_office_number-one_films_in_the_United_States" },
      { name: "Deadline: Weekend box office, 25–27 September", url: "https://deadline.com/2026/09/box-office-avengers-endgame-primetime-heart-of-the-beast-1237111302/" },
    ],
  },
  {
    slug: "miley-cyrus-bass-persuades-number-one",
    section: "music",
    kicker: "Charts",
    title: "Miley Cyrus goes to number one with Bass Persuades",
    deck: "Her tenth album opened at the top of the Billboard 200 with 61,000 units. Two Hollywood Bowl nights follow in October.",
    author: "Sana Lind",
    date: "2026-09-27",
    photo: { src: mileyPhoto, alt: "Miley Cyrus on stage at Primavera Sound in Barcelona, lit green and red", credit: "Jwslubbock, CC BY-SA 4.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Wikipedia: Bass Persuades", url: "https://en.wikipedia.org/wiki/Bass_Persuades" },
      { name: "Variety: Miley Cyrus announces Bass Persuades and Hollywood Bowl shows", url: "https://variety.com/2026/music/news/miley-cyrus-new-album-bass-persuades-hollywood-bowl-1236847024/" },
    ],
  },
  {
    slug: "sneaker-drops-late-september-2026",
    section: "culture",
    kicker: "Sneakers",
    title: "This week in sneakers: Bad Bunny’s BadBo, a Harden for Rayasianboy and Nike’s Hyperslides",
    deck: "A busy end to the month, from Jordan retros to a recovery slide made with Hyperice.",
    author: "Jonah Reyes",
    date: "2026-09-26",
    photo: { src: unsplash("photo-1556906781-9a412961c28c", 1600), alt: "A pair of Air Jordan 1 sneakers dangling over the edge of a rooftop", credit: "Unsplash", crop: { pos: "50% 55%" } },
    sources: [
      { name: "House of Heat: September 2026 sneaker releases", url: "https://houseofheat.co/upcoming-sneaker-releases-september-2026" },
    ],
  },
  {
    slug: "build-a-rocket-boy-administration",
    section: "games",
    kicker: "Industry",
    title: "MindsEye studio Build A Rocket Boy goes into administration",
    deck: "Leslie Benzies’s Edinburgh studio, founded after he left Rockstar North, has collapsed 15 months after MindsEye’s troubled launch.",
    author: "Jonah Reyes",
    date: "2026-09-25",
    photo: { src: benziesPhoto, alt: "Leslie Benzies, founder of Build A Rocket Boy, in a black-and-white portrait", credit: "Austin Hargrave, CC BY-SA 3.0", crop: { pos: "50% 22%" } },
    sources: [
      { name: "Wolf’s Gaming Blog: MindsEye developer Build A Rocket Boy enters administration", url: "https://wolfsgamingblog.com/2026/09/25/mindseye-developer-build-a-rocket-boy-enters-administration/" },
      { name: "Wikipedia: MindsEye", url: "https://en.wikipedia.org/wiki/MindsEye" },
    ],
  },
  {
    slug: "taylor-swift-the-life-of-a-showgirl-the-encore",
    section: "music",
    kicker: "New music",
    title: "Taylor Swift adds four songs with The Life of a Showgirl: The Encore",
    deck: "“Patient Zero”, “Cleveland!”, “Pink Clouding” and “Babylon” extend last year’s record-breaking album.",
    author: "Sana Lind",
    date: "2026-09-25",
    photo: { src: taylorPhoto, alt: "A packed stadium lit orange during Taylor Swift’s Eras Tour in London", credit: "BrigidLIS, CC BY 4.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "UPI: Taylor Swift releases “Showgirl” encore with new single “Patient Zero”", url: "https://www.upi.com/Entertainment_News/Music/2026/09/25/taylor-swift-showgirl-encore-patient-zero/7621790339274/" },
      { name: "Billboard: All 4 new songs on The Encore ranked", url: "https://www.billboard.com/lists/taylor-swift-life-of-showgirl-encore-tracks-ranked/" },
    ],
  },
  {
    slug: "epic-fortnite-dutch-class-action",
    section: "games",
    kicker: "Courts",
    title: "Dutch consumer group seeks more than €100 million from Epic over Fortnite",
    deck: "SMC says the Item Shop’s countdown timers and V-Bucks pushed young players into spending they regret. Epic points to its parental controls.",
    author: "Nia Vale",
    date: "2026-09-24",
    photo: { src: fortnitePhoto, alt: "The Fortnite Battle Royale booth at the Game Developers Conference 2018", credit: "Official GDC, CC BY 2.0", crop: { pos: "50% 40%" } },
    sources: [
      { name: "DualShockers: Dutch consumer group sues Epic over Fortnite practices", url: "https://www.dualshockers.com/dutch-consumer-group-sues-epic-for-misleading-fortnite-practices/" },
    ],
  },
  {
    slug: "mercury-prize-2026-shortlist",
    section: "music",
    kicker: "Awards",
    title: "Mercury Prize 2026: four weeks to go, and two favourites",
    deck: "Nia Archives and Suede lead a shortlist that also has Dave, RAYE, Olivia Dean and Paul McCartney. The winner is named in Newcastle on 22 October.",
    author: "Nia Vale",
    date: "2026-09-24",
    photo: { src: niaPhoto, alt: "Nia Archives singing on stage in Amsterdam under pink light", credit: "Michielderoo, CC0", crop: { pos: "50% 30%" } },
    sources: [
      { name: "Mercury Prize: 2026 Albums of the Year revealed", url: "https://www.mercuryprize.com/news/2026/2026-mercury-prize-albums-of-the-year-revealed/" },
      { name: "Billboard: 2026 Mercury Prize nominees", url: "https://www.billboard.com/music/awards/mercury-prize-2026-nominees-shortlist-raye-mccartney-1236304222/" },
    ],
  },
  {
    slug: "neuro-sama-pattern-recognition-first-concert",
    section: "streaming",
    kicker: "VTubers",
    title: "Neuro-sama releases “Pattern Recognition” and books her first live concert",
    deck: "The AI streamer’s new single with ODDEEO is out, and she and Evil Neuro play Los Angeles with a live band on 19 December.",
    author: "Jonah Reyes",
    date: "2026-09-22",
    photo: { src: youtubeThumb("xWDfREk0ZLs"), alt: "Artwork from the “Pattern Recognition” video: an anime-style girl in pink light", credit: "Neuro-sama, YouTube", crop: { pos: "50% 50%" } },
    sources: [
      { name: "BroadwayWorld: AI twins Neuro and Evil to perform first-ever live concert", url: "https://www.broadwayworld.com/bwwmusic/article/Photos-AI-Twins-Neuro-and-Evil-to-Perform-First-Ever-Live-Concert-at-Vermont-Hollywood-20260921" },
      { name: "YouTube: Pattern Recognition – Neuro-sama x ODDEEO (official video)", url: "https://www.youtube.com/watch?v=xWDfREk0ZLs" },
    ],
  },
  {
    slug: "marvels-wolverine-sales",
    section: "games",
    kicker: "Launch",
    title: "Marvel’s Wolverine sells 1.9 million in three days despite split reviews",
    deck: "Insomniac’s single-player action game topped the UK chart after its 15 September launch on PS5.",
    author: "Nia Vale",
    date: "2026-09-22",
    photo: { src: unsplash("photo-1753297514865-016ed7975966", 1600), alt: "A PlayStation 5 controller on a black surface", credit: "User_Pascal, Unsplash", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Wikipedia: Marvel’s Wolverine", url: "https://en.wikipedia.org/wiki/Marvel's_Wolverine" },
    ],
  },
  {
    slug: "jhene-aiko-westside-whimsy-number-one",
    section: "music",
    kicker: "Charts",
    title: "Jhené Aiko gets her first number one with Westside Whimsy",
    deck: "The album, with Kendrick Lamar, Ab-Soul, Larry June and Tyga among its guests, opened at the top of the Billboard 200 with 74,000 units.",
    author: "Nia Vale",
    date: "2026-09-21",
    photo: { src: jhenePhoto, alt: "Jhené Aiko singing into a microphone in an orange cap", credit: "The Come Up Show, CC BY 2.0", crop: { pos: "50% 30%" } },
    sources: [
      { name: "Wikipedia: Westside Whimsy", url: "https://en.wikipedia.org/wiki/Westside_Whimsy" },
    ],
  },
  {
    slug: "tokyo-game-show-2026-typhoon",
    section: "games",
    kicker: "Events",
    title: "Typhoon Dujuan cuts Tokyo Game Show’s first five-day run short",
    deck: "The 30th-anniversary show cancelled its final day, the 21 September public holiday, as the storm approached.",
    author: "Sana Lind",
    date: "2026-09-21",
    photo: { src: tgsPhoto, alt: "Crowds in the halls of Tokyo Game Show 2026 at Makuhari Messe", credit: "Syced, CC0", crop: { pos: "50% 60%" } },
    sources: [
      { name: "Kotaku: Typhoon Dujuan forces Tokyo Game Show 2026 to shut down a day early", url: "https://kotaku.com/typhoon-dujuan-forces-tokyo-game-show-2026-to-shut-down-a-day-early-2000735879" },
      { name: "Anime News Network: Tokyo Game Show 2026 cancels final day", url: "https://www.animenewsnetwork.com/news/2026-09-19/tokyo-game-show-2026-cancels-final-day-on-monday-due-to-approaching-typhoon/.241974" },
    ],
  },
  {
    slug: "physint-bill-skarsgard-xbox",
    section: "games",
    kicker: "Tokyo Game Show",
    title: "Bill Skarsgård will star in Kojima’s PHYSINT, now an Xbox game",
    deck: "Hideo Kojima named his lead at the Xbox Tokyo Game Show broadcast, a week after Xbox picked up the spy game.",
    author: "Nia Vale",
    date: "2026-09-18",
    photo: { src: skarsgardPhoto, alt: "Bill Skarsgård listening on a convention panel", credit: "Gage Skidmore, CC BY-SA 2.0", crop: { pos: "60% 35%" } },
    sources: [
      { name: "Xbox Wire: Bill Skarsgård cast as the lead role in PHYSINT", url: "https://news.xbox.com/en-us/2026/09/17/physint-lead-role-bill-skarsgard-kojima-productions-xbox/" },
      { name: "Kotaku: PHYSINT’s lead will be played by Bill Skarsgård", url: "https://kotaku.com/kojima-says-physint-is-making-steady-progress-and-stars-bill-skarsgard-in-first-update-since-switching-to-xbox-2000735260" },
    ],
  },
  {
    slug: "emmys-2026-winners",
    section: "culture",
    kicker: "TV",
    title: "Emmys 2026: The Pitt repeats, and Matthew Rhys wins twice",
    deck: "Widow’s Bay took best comedy, DTF St. Louis best limited series, and Rhea Seehorn won her first Emmy.",
    author: "Nia Vale",
    date: "2026-09-15",
    photo: { src: wylePhoto, alt: "Noah Wyle smiling at his Hollywood Walk of Fame ceremony", credit: "Kevin Paul, CC BY 4.0", crop: { pos: "50% 30%" } },
    sources: [
      { name: "Wikipedia: 78th Primetime Emmy Awards", url: "https://en.wikipedia.org/wiki/78th_Primetime_Emmy_Awards" },
      { name: "NPR: Emmys 2026, the complete list of winners", url: "https://www.npr.org/2026/09/14/nx-s1-5957565/emmys-2026-winners" },
    ],
  },
  {
    slug: "venice-2026-woman-unknown-golden-lion",
    section: "culture",
    kicker: "Film",
    title: "Venice gives its Golden Lion to May el-Toukhy’s Woman Unknown",
    deck: "The Danish post-war thriller also won best actress for Mathilde Arcel. John Malkovich took best actor.",
    author: "Sana Lind",
    date: "2026-09-13",
    photo: { src: venicePhoto, alt: "The red carpet and a row of flags outside the Palazzo del Cinema in Venice", credit: "Pietro Luca Cassarino, CC BY-SA 2.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Wikipedia: 83rd Venice International Film Festival", url: "https://en.wikipedia.org/wiki/83rd_Venice_International_Film_Festival" },
      { name: "Screen Daily: Woman Unknown wins Golden Lion", url: "https://www.screendaily.com/news/woman-unknown-wins-golden-lion-at-venice-film-festival-2026/5220360.article" },
    ],
  },
  {
    slug: "blizzcon-2026-diablo-v-starcraft",
    section: "games",
    kicker: "Events",
    title: "BlizzCon 2026: Diablo V for 2029, and StarCraft becomes an open-world shooter",
    deck: "Blizzard looked years ahead in Anaheim, with a Netflix Diablo series and a new Overwatch hero for now.",
    author: "Jonah Reyes",
    date: "2026-09-13",
    photo: { src: blizzconPhoto, alt: "Fans outside the Anaheim Convention Center during BlizzCon", credit: "tofuprod, CC BY-SA 2.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Blizzard: Everything announced at the BlizzCon 2026 opening ceremony", url: "https://news.blizzard.com/en-us/article/24301453/everything-announced-at-blizzcon-2026-opening-ceremony" },
      { name: "GameSpot: BlizzCon 2026 opening ceremony", url: "https://www.gamespot.com/articles/blizzcon-2026-opening-ceremony-all-the-biggest-announcements-and-games/" },
    ],
  },
  {
    slug: "lil-durk-not-guilty-murder-for-hire",
    section: "music",
    kicker: "Courts",
    title: "Lil Durk found not guilty in his murder-for-hire trial",
    deck: "A Los Angeles federal jury cleared the Chicago rapper of every charge on 11 September. He stays in custody ahead of a separate racketeering trial.",
    author: "Nia Vale",
    date: "2026-09-12",
    photo: { src: durkPhoto, alt: "Lil Durk in a black jumper and a gold chain with a cross", credit: "Daniel X. O’Neil, CC BY 2.0", crop: { pos: "50% 18%" } },
    sources: [
      { name: "NBC New York: Jury finds rapper Lil Durk not guilty in murder-for-hire case", url: "https://www.nbcnewyork.com/news/national-international/verdict-lil-durk-murder-trial-beverly-center-shooting/6546871/" },
    ],
  },
  {
    slug: "wardogs-launch-theburntpeanut",
    section: "streaming",
    kicker: "Launch week",
    title: "WARDOGS pulls 452,600 viewers at launch, with TheBurntPeanut out front",
    deck: "The shooter’s early access release on 10 September became one of Twitch’s biggest game launches of the year.",
    author: "Sana Lind",
    date: "2026-09-11",
    photo: { src: youtubeThumb("D-gZx4lbGbo"), alt: "Thumbnail from TheBurntPeanut’s WARDOGS video", credit: "TheBurntPeanut, YouTube", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Streams Charts: WARDOGS viewership statistics", url: "https://streamscharts.com/news/wardogs-viewership-statistics" },
      { name: "Twitch: State of Gaming 2026", url: "https://blog.twitch.tv/en/2026/09/09/twitch-state-of-gaming-2026/" },
    ],
  },
  {
    slug: "twitch-state-of-gaming-2026",
    section: "streaming",
    kicker: "Data",
    title: "Twitch: 8.6 billion hours of gaming watched so far this year",
    deck: "League of Legends leads again, horror and indie games are growing, and Jynxzi and TheBurntPeanut stand out among creators.",
    author: "Jonah Reyes",
    date: "2026-09-09",
    photo: { src: twitchconPhoto, alt: "Crowds and stage lights at the TwitchCon block party at night", credit: "Succubussy, CC0", crop: { pos: "50% 55%" } },
    sources: [
      { name: "Twitch: State of Gaming 2026", url: "https://blog.twitch.tv/en/2026/09/09/twitch-state-of-gaming-2026/" },
      { name: "TwitchCon San Diego 2026", url: "https://www.twitchcon.com/san-diego-2026/" },
    ],
  },
  {
    slug: "z-event-2026-final-edition",
    section: "streaming",
    kicker: "Charity",
    title: "Z Event signs off with a record €32.9 million for charity",
    deck: "ZeratoR’s French charity marathon doubled last year’s total in its tenth and final edition.",
    author: "Nia Vale",
    date: "2026-09-07",
    photo: { src: zeratorPhoto, alt: "ZeratoR streaming at his desk during Z Event", credit: "Mickaël Schauli, CC BY-SA 4.0", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Streams Charts: Z Event 2026 recap", url: "https://streamscharts.com/news/z-event-2026-recap" },
    ],
  },
  {
    slug: "onimusha-way-of-the-sword-launch",
    section: "games",
    kicker: "Launch",
    title: "Onimusha: Way of the Sword sells a million on day one",
    deck: "Capcom’s revival of its samurai series is out on Switch 2, PS5, PC and Xbox, and critics are calling it one of the best action games of the year.",
    author: "Jonah Reyes",
    date: "2026-09-05",
    photo: { src: youtubeThumb("Gbmd6YFm5oU"), alt: "A frame from the Onimusha: Way of the Sword launch trailer", credit: "Capcom, YouTube", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Wikipedia: Onimusha: Way of the Sword", url: "https://en.wikipedia.org/wiki/Onimusha:_Way_of_the_Sword" },
      { name: "Nintendo Life: The reviews for Onimusha: Way of the Sword are in", url: "https://www.nintendolife.com/news/2026/09/round-up-the-reviews-for-onimusha-way-of-the-sword-are-in" },
    ],
  },
  {
    slug: "ishowspeed-world-talent-show",
    section: "streaming",
    kicker: "Live",
    title: "IShowSpeed’s World Talent Show, and the “green apple” moment",
    deck: "Three hours of acts from around the world, one clear winner and a meme that spread before the stream was over.",
    author: "Nia Vale",
    date: "2026-09-05",
    photo: { src: speedPhoto, alt: "IShowSpeed in an England shirt surrounded by fans and cameras in Singapore", credit: "Aerodynamically, CC0", crop: { pos: "40% 35%" } },
    sources: [
      { name: "TubioNews: IShowSpeed’s World Talent Show", url: "https://tubionews.com/news/ishowspeed-world-talent-show-september-2026" },
      { name: "YouTube: IShowSpeed, World Talent Show", url: "https://www.youtube.com/watch?v=4zVFht1KbnY" },
    ],
  },
  {
    slug: "state-of-play-september-2026",
    section: "games",
    kicker: "Showcase",
    title: "State of Play: Final Fantasy VII Revelation dated for April 2027",
    deck: "PlayStation’s September show also dated Metro 2039 and Until Dawn 2, and revealed Maneater 2.",
    author: "Sana Lind",
    date: "2026-09-04",
    photo: { src: youtubeThumb("KpXesINIQc4"), alt: "The title card of PlayStation’s State of Play broadcast for 3 September 2026", credit: "PlayStation, YouTube", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Streams Charts: State of Play September 2026 viewership", url: "https://streamscharts.com/news/state-play-september-2026-viewership" },
      { name: "Techloy: State of Play September 2026, everything announced", url: "https://www.techloy.com/playstation-state-of-play-september-2026-everything-announced/" },
    ],
  },
  {
    slug: "keffe-d-guilty-tupac-shakur-murder",
    section: "music",
    kicker: "Courts",
    title: "Keffe D found guilty of Tupac Shakur’s murder, 30 years on",
    deck: "A Las Vegas jury convicted Duane Davis of first-degree murder on 31 August. He faces life in prison when he is sentenced on 13 October.",
    author: "Sana Lind",
    date: "2026-09-01",
    photo: { src: tupacStarPhoto, alt: "Tupac Shakur’s star on the Hollywood Walk of Fame", credit: "Alexis Doine, CC0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "NBC News: Duane ‘Keffe D’ Davis found guilty in Tupac Shakur’s 1996 killing", url: "https://www.nbcnews.com/news/us-news/verdict-trial-tupac-shakurs-killing-former-gang-leader-found-guilty-rcna594859" },
    ],
  },
  {
    slug: "kai-cenat-ishowspeed-minecraft-marathon",
    section: "streaming",
    kicker: "Records",
    title: "Kai Cenat and IShowSpeed’s Minecraft marathon passed 30 million hours watched",
    deck: "Five days, 121 hours and 42 deaths later, they beat the Ender Dragon, and out-watched most of this year’s esports events.",
    author: "Jonah Reyes",
    date: "2026-08-13",
    photo: { src: kaiPhoto, alt: "Kai Cenat in a black durag, speaking outdoors", credit: "ImDavisss Live, CC BY 3.0", crop: { pos: "50% 28%" } },
    sources: [
      { name: "Streams Charts: Kai Cenat & IShowSpeed Minecraft marathon recap", url: "https://streamscharts.com/news/kai-cenat-ishowspeed-2026-minecraft-marathon-recap" },
    ],
  },
];

export const ARTICLES: Article[] = RAW_ARTICLES.map((story) => {
  const full = STORY_BODIES[story.slug];
  const body = full?.body ?? [];
  return { ...story, body, read: `${Math.max(2, Math.round(wordCount(body) / 230))} min read`, ...(full?.ask ? { ask: full.ask } : {}) };
});

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);
export const articlesIn = (section: SectionId) => ARTICLES.filter((a) => a.section === section);
export const article = (slug: string) => getArticle(slug)!;

// Curated orders used across the site
export const LEAD = article("vmas-2026-winners");
export const LISTS = {
  latest: ARTICLES.slice(0, 6),
  trending: ["gta-vi-countdown", "vmas-2026-winners", "onimusha-way-of-the-sword-launch", "miley-cyrus-bass-persuades-number-one", "avengers-endgame-encore-box-office"].map(article),
  mostRead: ["vmas-2026-winners", "gta-vi-countdown", "taylor-swift-the-life-of-a-showgirl-the-encore", "emmys-2026-winners", "z-event-2026-final-edition"].map(article),
  editorsPicks: ["paris-fashion-week-ss27", "tokyo-game-show-2026-typhoon", "blizzcon-2026-diablo-v-starcraft", "twitch-state-of-gaming-2026", "bts-arirang-world-tour-latin-america"].map(article),
  featured: ["vmas-2026-winners", "paris-fashion-week-ss27", "gta-vi-countdown", "z-event-2026-final-edition", "taylor-swift-the-life-of-a-showgirl-the-encore"].map(article),
};

export const READING_LISTS = [
  { id: "pop-week", title: "Pop’s big week", note: "The VMAs, a Taylor Swift encore and BTS on the road.", cover: undefined as Photo | undefined, items: ["vmas-2026-winners", "taylor-swift-the-life-of-a-showgirl-the-encore", "bts-arirang-world-tour-latin-america"].map(article) },
  { id: "games-to-watch", title: "Games to watch", note: "Launches, delays and the showcases setting up 2027.", cover: undefined as Photo | undefined, items: ["gta-vi-countdown", "marvels-wolverine-sales", "blizzcon-2026-diablo-v-starcraft"].map(article) },
  { id: "live-on-stream", title: "Live on stream", note: "Records, marathons and the numbers behind Twitch.", cover: undefined as Photo | undefined, items: ["z-event-2026-final-edition", "wardogs-launch-theburntpeanut", "twitch-state-of-gaming-2026"].map(article) },
];

// ---------------------------------------------------------------- Streamers
// Streamers to watch (the Streaming front and Explore): each with a recent
// video from their own channel.

export type Streamer = { name: string; platform: "Twitch" | "YouTube"; channel: string; note: string; video: string; videoTitle: string };
export const STREAMERS: Streamer[] = [
  { name: "Kai Cenat", platform: "Twitch", channel: "https://www.twitch.tv/kaicenat", note: "Twitch’s most-followed streamer, back from hosting Streamer University 2026.", video: "t4rPg4OYonk", videoTitle: "Streamer University 2026 Best Moments!" },
  { name: "IShowSpeed", platform: "YouTube", channel: "https://www.youtube.com/@IShowSpeed", note: "Turned his channel into a worldwide talent show, live.", video: "4zVFht1KbnY", videoTitle: "World Talent Show" },
  { name: "TheBurntPeanut", platform: "Twitch", channel: "https://www.twitch.tv/theburntpeanut", note: "Led the WARDOGS launch on Twitch and YouTube.", video: "D-gZx4lbGbo", videoTitle: "Peanut Absolutely Loses It In WARDOGS" },
  { name: "Jynxzi", platform: "Twitch", channel: "https://www.twitch.tv/jynxzi", note: "78 million hours watched on Twitch in 2026 so far.", video: "FDXpzsK0KI4", videoTitle: "YOU vs The RANK You “Deserve”… (Rainbow Six Siege)" },
  { name: "ZeratoR", platform: "Twitch", channel: "https://www.twitch.tv/zerator", note: "Closed the final Z Event with €32.9 million raised for charity.", video: "UlXf1lsiQPw", videoTitle: "MON ZEVENT 2026 – Best of ZeratoR #507" },
  { name: "Neuro-sama", platform: "Twitch", channel: "https://www.twitch.tv/vedal987", note: "The AI VTuber behind Twitch’s record hype trains has a new single out.", video: "xWDfREk0ZLs", videoTitle: "Pattern Recognition – Neuro-sama x ODDEEO (Official Video)" },
];

// ---------------------------------------------------------------- Content of the month
// The creators who won the year's top streaming awards (The Streamer Awards,
// 6 December 2025), ranked: Streamer of the Year first, then by awards won.
// Each shows a recent video from their own channel.

export type RankedCreator = {
  rank: number;
  name: string;
  honour: string; // the headline award
  awards: string[]; // everything they won
  channel: string;
  channelName: string;
  video: string;
  videoTitle: string;
};
export const CONTENT_OF_THE_MONTH: RankedCreator[] = [
  { rank: 1, name: "IShowSpeed", honour: "Streamer of the Year", awards: ["Streamer of the Year, second year running", "Best IRL Streamer"], channel: "https://www.youtube.com/@IShowSpeed", channelName: "IShowSpeed on YouTube", video: "4zVFht1KbnY", videoTitle: "World Talent Show" },
  { rank: 2, name: "Kai Cenat", honour: "Four awards", awards: ["Best Just Chatting Streamer", "Best Streamed Event: Streamer University", "Best Marathon: Mafiathon 3", "Best Collab, with LeBron James"], channel: "https://www.youtube.com/@KaiCenat", channelName: "Kai Cenat on YouTube", video: "Dt36OGjw26Y", videoTitle: "Don’t Quit" },
  { rank: 3, name: "CaseOh", honour: "Gamer of the Year", awards: ["Gamer of the Year", "Best Variety Streamer"], channel: "https://www.youtube.com/@MoreCaseOh", channelName: "MoreCaseOh on YouTube", video: "upPT0i8MTrE", videoTitle: "CaseOh Returns To The Buckshot Arena Yet Again!" },
  { rank: 4, name: "TheBurntPeanut", honour: "Best VTuber", awards: ["Best VTuber", "Best FPS Streamer"], channel: "https://www.youtube.com/@TheBurntPeanut", channelName: "TheBurntPeanut on YouTube", video: "D-gZx4lbGbo", videoTitle: "Peanut Absolutely Loses It In WARDOGS" },
  { rank: 5, name: "Adapt", honour: "Breakout Streamer", awards: ["Best Breakout Streamer"], channel: "https://www.youtube.com/@FaZeAdaptLive", channelName: "Adapt Live on YouTube", video: "pqvIG2V7fII", videoTitle: "I Spent $1000 on Action Figures.." },
];
export const AWARDS_SOURCE = { name: "Wikipedia: 2025 Streamer Awards", url: "https://en.wikipedia.org/wiki/2025_Streamer_Awards" };

// ---------------------------------------------------------------- The No. 1 rapper vote
// The poll on the rap desk (home page): five names, each with the case for
// them from "Five rappers, five number ones". The ids are what the vote
// counter keeps (src/lib/rap-poll.ts).

export const RAP_POLL_CHOICES = ["kendrick", "drake", "cole", "future", "cardi"] as const;
export type RapPollChoice = (typeof RAP_POLL_CHOICES)[number];
export type Contender = { id: RapPollChoice; name: string; photo: Photo; case: string };
export const RAP_POLL: { question: string; story: string; contenders: Contender[] } = {
  question: "Who’s the No. 1 rapper right now?",
  story: "rap-number-ones-2026",
  contenders: [
    { id: "kendrick", name: "Kendrick Lamar", photo: { src: kendrickPhoto, alt: "Kendrick Lamar smiling", credit: "Fuzheado, CC BY-SA 4.0", crop: { pos: "42% 30%" } }, case: "27 Grammys, the most of any rapper" },
    { id: "drake", name: "Drake", photo: { src: drakePhoto, alt: "Drake on stage", credit: "The Come Up Show, CC BY 2.0", crop: { pos: "50% 22%" } }, case: "Held Nos. 1, 2 and 3 on the Billboard 200 at once" },
    { id: "cole", name: "J. Cole", photo: { src: colePhoto, alt: "J. Cole smiling on stage", credit: "H D, CC BY 2.0", crop: { pos: "55% 22%" } }, case: "The Fall-Off went straight to No. 1" },
    { id: "future", name: "Future", photo: { src: futurePhoto, alt: "Future in sunglasses and a leather jacket", credit: "thecomeupshow, CC BY 2.0", crop: { pos: "50% 20%" } }, case: "12th No. 1 album, one more than Eminem" },
    { id: "cardi", name: "Cardi B", photo: { src: cardiPhoto, alt: "Cardi B at the 2018 VMAs", credit: "Nicole Alexander, CC BY 3.0", crop: { pos: "40% 35%" } }, case: "Best Hip-Hop at the 2026 VMAs for “Safe”" },
  ],
};

// ---------------------------------------------------------------- Upcoming events
// What is coming up across music, games, film, fashion and streaming, in date
// order. `slug` links an event to the story that covers it; `to` to a section.

export type EventCategory = "Music" | "Games" | "Film" | "Fashion" | "Streaming";
export type UpcomingEvent = { date: string; end?: string; category: EventCategory; title: string; detail: string; slug?: string };
export const EVENTS: UpcomingEvent[] = [
  { date: "2026-10-02", category: "Games", title: "Ace Combat 8: Wings of Theve", detail: "Bandai Namco’s flight combat game, playable at Tokyo Game Show" },
  { date: "2026-10-02", end: "2026-10-03", category: "Music", title: "BTS in Bogotá", detail: "The Arirang World Tour opens its Latin America leg", slug: "bts-arirang-world-tour-latin-america" },
  { date: "2026-10-06", category: "Fashion", title: "Louis Vuitton closes Paris Fashion Week", detail: "The last show of the spring/summer 2027 season", slug: "paris-fashion-week-ss27" },
  { date: "2026-10-16", category: "Film", title: "Whalefall", detail: "20th Century Studios’ adaptation of Daniel Kraus’s novel" },
  { date: "2026-10-16", end: "2026-10-18", category: "Music", title: "Miley Cyrus at the Hollywood Bowl", detail: "Two rare shows, with Model/Actriz opening", slug: "miley-cyrus-bass-persuades-number-one" },
  { date: "2026-10-20", category: "Games", title: "Hearthstone: Reign of the Black Empire", detail: "The next expansion, announced at BlizzCon", slug: "blizzcon-2026-diablo-v-starcraft" },
  { date: "2026-10-22", category: "Music", title: "Mercury Prize 2026", detail: "The winner is named live in Newcastle", slug: "mercury-prize-2026-shortlist" },
  { date: "2026-10-23", category: "Film", title: "Klara and the Sun", detail: "Taika Waititi adapts Kazuo Ishiguro’s novel" },
  { date: "2026-11-04", category: "Games", title: "World of Warcraft: Forever", detail: "Blizzard’s new way to play launches", slug: "blizzcon-2026-diablo-v-starcraft" },
  { date: "2026-11-06", category: "Film", title: "The Cat in the Hat", detail: "Warner Bros.’ animated musical" },
  { date: "2026-11-12", category: "Streaming", title: "The Streamer Awards 2026", detail: "Streaming’s big night, in Los Angeles" },
  { date: "2026-11-13", end: "2026-11-15", category: "Streaming", title: "TwitchCon San Diego", detail: "Three days at the San Diego Convention Center", slug: "twitch-state-of-gaming-2026" },
  { date: "2026-11-19", category: "Games", title: "Grand Theft Auto VI", detail: "Out on PS5 and Xbox Series X|S at midnight", slug: "gta-vi-countdown" },
  { date: "2026-11-20", category: "Film", title: "The Hunger Games: Sunrise on the Reaping", detail: "Haymitch’s Games, 24 years before the first film" },
  { date: "2026-11-25", category: "Film", title: "Hexe", detail: "Disney’s original animated film, starring Hailee Steinfeld" },
  { date: "2026-12-04", category: "Film", title: "Violent Night 2", detail: "David Harbour returns as Santa" },
  { date: "2026-12-10", category: "Games", title: "The Game Awards 2026", detail: "Live from the Peacock Theater, Los Angeles" },
  { date: "2026-12-18", category: "Film", title: "Avengers: Doomsday", detail: "Marvel’s next Avengers film" },
  { date: "2026-12-19", category: "Streaming", title: "Neuro-sama & Evil Neuro live", detail: "The AI twins’ first concert, with a live band in LA", slug: "neuro-sama-pattern-recognition-first-concert" },
];

// ---------------------------------------------------------------- Songs to check out

// Each song opens on Spotify, shown with its album cover (Spotify's own
// artwork, from the track's public page).
export type Song = { artist: string; title: string; album: string; year: number; note: string; spotify: string; cover: string };
const spotifyCover = (id: string) => `https://i.scdn.co/image/ab67616d0000b273${id}`;
export const SONGS: Song[] = [
  { artist: "Taylor Swift", title: "Patient Zero", album: "The Life of a Showgirl: The Encore", year: 2026, note: "The lead single from The Life of a Showgirl: The Encore, out 25 September.", spotify: "49JeKZqejPtqJKpK7x9Ew4", cover: spotifyCover("b2de0f5e12f0b369fde79953") },
  { artist: "BTS", title: "Swim", album: "ARIRANG", year: 2026, note: "Song of the Year at the 2026 VMAs, and the centrepiece of the Arirang tour.", spotify: "68lbSrXDORS51pmyjZv712", cover: spotifyCover("dfa17fad7f190c901603270e") },
  { artist: "Cardi B feat. Kehlani", title: "Safe", album: "AM I THE DRAMA?", year: 2025, note: "Best Hip-Hop at the 2026 VMAs.", spotify: "5q9I5RmmrLC4U2mW2BnF3K", cover: spotifyCover("4449c12628ef639dd6500c4a") },
  { artist: "Bad Bunny", title: "NUEVAYoL", album: "DeBÍ TiRAR MáS FOToS", year: 2025, note: "Best Latin at the 2026 VMAs.", spotify: "5TFD2bmFKGhoCRbX61nXY5", cover: spotifyCover("bbd45c8d36e0e045ef640411") },
  { artist: "LISA", title: "Dream", album: "Alter Ego", year: 2025, note: "Best Pop at the 2026 VMAs, for the short film with Kentaro Sakaguchi.", spotify: "5fFdUV9NMDxPjgkS54My63", cover: spotifyCover("4a5dbcceaff49f85a1f1e756") },
];

// The live listing on the Music front
export const LIVE = {
  kicker: "Live · Tickets",
  title: "BTS: Arirang World Tour",
  meta: "Bogotá 2–3 Oct · Lima · Santiago · La Plata · São Paulo",
  url: "https://ibighit.com/bts/eng/",
  photo: { src: btsStadiumPhoto, alt: "A full stadium in Paris waiting for BTS", credit: "Chiyako92, CC BY-SA 4.0", crop: { pos: "50% 55%" } } satisfies Photo,
};

// ---------------------------------------------------------------- OGCW Originals

export type Episode = {
  slug: string;
  series: string;
  number: number;
  title: string;
  kind: string;
  length: string;
  date: string;
  still: Photo; // the frame shown on posters and in the player
  summary: string;
  body: string[];
  chapters: [string, string][];
  credits: [string, string][];
  related: string[]; // article slugs
};

export const EPISODES: Episode[] = [
  {
    slug: "inside-the-listening-bar",
    series: "OGCW Sessions", number: 1, kind: "Interview", length: "12:40", date: "2026-09-26",
    still: { src: unsplash("photo-1508700115892-45ecd05ae2ad", 1600), alt: "A neon sign reading “you are what you listen to” on a brick wall", crop: { pos: "50% 50%" } },
    title: "Inside the listening bar: one night, one record",
    summary: "We spend a night in a listening bar and ask the selector why one record can hold a room.",
    body: [
      "One room, one sound system and one rule: listen. OGCW Sessions spends a night behind the counter of a listening bar, from the first record at opening to the last track before the lights come up.",
      "The selector talks us through how a night is built, why albums beat playlists and what happens to a crowd when nobody reaches for their phone.",
    ],
    chapters: [["00:00", "Opening the room"], ["02:15", "Choosing the first record"], ["06:40", "The crowd goes quiet"], ["10:05", "Last track"]],
    credits: [["Series", "OGCW Sessions"], ["Produced by", "OGCW"], ["Format", "Interview"]],
    related: [],
  },
  {
    slug: "made-to-last-object-makers",
    series: "Made to Last", number: 1, kind: "Reportage", length: "08:15", date: "2026-09-23",
    still: { src: unsplash("photo-1558618666-fcd25c85cd64", 1600), alt: "A maker at work at a lathe in a small studio", crop: { pos: "50% 45%" } },
    title: "Made to last: in the studio with the object makers",
    summary: "In the studio with designers building sneakers, headphones and homeware to keep, not to flip.",
    body: [
      "Made to Last visits the studios of designers who build objects meant to outlive the feed, from repairable headphones to shoes resoled rather than replaced.",
      "We follow a single piece from sketch to finished object and ask what it takes to design for ten years instead of ten days.",
    ],
    chapters: [["00:00", "The studio"], ["01:50", "Materials first"], ["04:30", "Repair, not replace"], ["07:10", "What lasting means"]],
    credits: [["Series", "Made to Last"], ["Produced by", "OGCW"], ["Format", "Reportage"]],
    related: ["sneaker-drops-late-september-2026"],
  },
  {
    slug: "the-list-records-that-shaped-the-year",
    series: "The List", number: 1, kind: "The list", length: "05:32", date: "2026-09-20",
    still: { src: unsplash("photo-1470225620780-dba8ba36b745", 1600), alt: "A DJ’s hands on a controller lit purple", crop: { pos: "50% 50%" } },
    title: "Ten records that shaped the year so far",
    summary: "The OGCW music desk counts down the records everyone kept coming back to.",
    body: [
      "The List is OGCW’s fast countdown format. In this first episode the music desk argues its way through the records that defined the year so far, from K-pop to Latin, pop and rap.",
      "Expect disagreements, a few surprises and at least one record you’ll want to go back to.",
    ],
    chapters: [["00:00", "The rules"], ["00:45", "10 to 6"], ["02:40", "5 to 2"], ["04:30", "Number one"]],
    credits: [["Series", "The List"], ["Produced by", "OGCW music desk"], ["Format", "Countdown"]],
    related: ["vmas-2026-winners", "taylor-swift-the-life-of-a-showgirl-the-encore"],
  },
  {
    slug: "street-level-independent-labels",
    series: "Street Level", number: 1, kind: "Reportage", length: "10:05", date: "2026-09-18",
    still: { src: unsplash("photo-1445205170230-053b83016050", 1600), alt: "Clothes on rails backstage, lit warm", crop: { pos: "50% 50%" } },
    title: "Independent labels, off the runway",
    summary: "Backstage at a show staged under a bridge, with the labels skipping fashion week altogether.",
    body: [
      "Street Level follows the independent labels putting on shows in car parks, basements and under bridges, with friends as models and local producers on the soundtrack.",
      "We go backstage before, during and after a show to see how a collection comes together without a fashion house behind it.",
    ],
    chapters: [["00:00", "Finding the location"], ["03:10", "Casting from friends"], ["06:00", "Showtime"], ["08:45", "Sold in the room"]],
    credits: [["Series", "Street Level"], ["Produced by", "OGCW"], ["Format", "Reportage"]],
    related: ["paris-fashion-week-ss27"],
  },
  {
    slug: "city-notes-where-brutalism-lives",
    series: "City Notes", number: 1, kind: "Analysis", length: "07:48", date: "2026-09-15",
    still: { src: barbicanPhoto, alt: "Concrete towers and walkways over the lake at London’s Barbican Estate", credit: "Julian Herzog, CC BY 4.0", crop: { pos: "50% 55%" } },
    title: "Where brutalism lives now",
    summary: "A walk through the concrete buildings a new generation wants to save.",
    body: [
      "City Notes is a walking series about how cities shape culture. This episode tours the brutalist buildings that became the backdrop for a generation’s photographs and videos.",
      "Along the way: why concrete photographs so well at night, and what these buildings still promise the public.",
    ],
    chapters: [["00:00", "Concrete at night"], ["02:20", "Built for the public"], ["05:05", "Saving what’s left"]],
    credits: [["Series", "City Notes"], ["Produced by", "OGCW"], ["Format", "Analysis"]],
    related: [],
  },
  {
    slug: "print-run-the-zine-makers",
    series: "Print Run", number: 1, kind: "Short doc", length: "09:20", date: "2026-09-12",
    still: { src: unsplash("photo-1457369804613-52c61a468e7d", 1600), alt: "Printed pages laid out edge to edge", crop: { pos: "50% 50%" } },
    title: "The zine makers",
    summary: "In a shared studio with the people printing small-run magazines that sell out in days.",
    body: [
      "Print Run spends a week in a shared studio where small-run magazines and zines are made, printed and packed by hand.",
      "We follow one issue from layout to launch night, and ask why a printed page still matters to people who grew up online.",
    ],
    chapters: [["00:00", "The studio"], ["02:40", "Layout"], ["05:15", "On the press"], ["08:00", "Launch night"]],
    credits: [["Series", "Print Run"], ["Produced by", "OGCW"], ["Format", "Short documentary"]],
    related: [],
  },
];

export const getEpisode = (slug: string) => EPISODES.find((e) => e.slug === slug);

// ---------------------------------------------------------------- Shop

export type Product = { name: string; detail: string; category: "Footwear" | "Clothing" | "Accessories"; price: number; image: string; url: string };
export type Shop = {
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  why: string;
  priceNote: string;
  hero: Photo;
  site: string;
  products: Product[];
};

const search = {
  nike: (q: string) => `https://www.nike.com/w?q=${encodeURIComponent(q)}`,
  adidas: (q: string) => `https://www.adidas.com/search?q=${encodeURIComponent(q)}`,
  stockx: (q: string) => `https://stockx.com/search?s=${encodeURIComponent(q)}`,
};

export const SHOPS: Shop[] = [
  {
    slug: "nike",
    name: "Nike",
    tagline: "Air Max, Dunks and the latest drops",
    intro: "The icons that never left the rotation, picked by the OGCW style desk.",
    why: "Nike’s archive is culture’s archive. From the courts to the club, these are the silhouettes that keep showing up in the stories we cover.",
    priceNote: "Guide retail prices",
    hero: { src: unsplash("photo-1637844528447-aee837ccfc7f", 1600), alt: "An orange Nike swoosh lit up on the corner of a dark building", crop: { pos: "50% 80%" } },
    site: "https://www.nike.com",
    products: [
      { name: "Air Force 1 ’07", detail: "White / White", category: "Footwear", price: 119.99, image: unsplash("photo-1712168332222-c1996322f935", 800), url: search.nike("air force 1 07") },
      { name: "Dunk Low Retro", detail: "White / Black", category: "Footwear", price: 119.99, image: unsplash("photo-1623684225794-a8f1f5037f5c", 800), url: search.nike("dunk low retro") },
      { name: "Air Max 90", detail: "Seasonal colourway", category: "Footwear", price: 149.99, image: unsplash("photo-1514989940723-e8e51635b782", 800), url: search.nike("air max 90") },
      { name: "Blazer Mid ’77 Vintage", detail: "White / Black", category: "Footwear", price: 109.99, image: unsplash("photo-1615424902876-df124220b0b6", 800), url: search.nike("blazer mid 77") },
      { name: "Air Jordan 1 Mid", detail: "White / Black / Red", category: "Footwear", price: 129.99, image: unsplash("photo-1597045566677-8cf032ed6634", 800), url: search.nike("air jordan 1 mid") },
      { name: "Club Fleece Hoodie", detail: "Black", category: "Clothing", price: 64.99, image: unsplash("photo-1586791400644-b04429f7d808", 800), url: search.nike("club fleece hoodie") },
    ],
  },
  {
    slug: "adidas",
    name: "Adidas",
    tagline: "Sambas, Gazelles and the Originals line",
    intro: "Three stripes, terrace heritage and the low-profile shoes everyone is wearing again.",
    why: "Adidas Originals moved from the terraces to the runway without losing its roots. These are the pairs that define the look right now.",
    priceNote: "Guide retail prices",
    hero: { src: unsplash("photo-1778521269710-748a3e4d5e15", 1600), alt: "A neon Adidas trefoil in a store window, clothing rails behind", crop: { pos: "50% 45%" } },
    site: "https://www.adidas.com",
    products: [
      { name: "Samba OG", detail: "Cloud White / Core Black / Gum", category: "Footwear", price: 120, image: unsplash("photo-1718220095476-7916e897fc55", 800), url: search.adidas("samba og") },
      { name: "Gazelle", detail: "Grey / White", category: "Footwear", price: 110, image: unsplash("photo-1726312045271-63d746467b48", 800), url: search.adidas("gazelle") },
      { name: "Campus 00s", detail: "Burgundy / White", category: "Footwear", price: 120, image: unsplash("photo-1621665422246-fde75fb7e7f5", 800), url: search.adidas("campus 00s") },
      { name: "Superstar", detail: "White / Black", category: "Footwear", price: 110, image: unsplash("photo-1758665630748-08141996c144", 800), url: search.adidas("superstar") },
      { name: "Forum Low", detail: "White / Black", category: "Footwear", price: 110, image: unsplash("photo-1715773408837-b7074beb12d5", 800), url: search.adidas("forum low") },
      { name: "Samba OG", detail: "Cloud White / Green", category: "Footwear", price: 120, image: unsplash("photo-1695552836001-e34239c9c9d4", 800), url: search.adidas("samba og green") },
    ],
  },
  {
    slug: "stockx",
    name: "StockX",
    tagline: "Verified sneakers at live resale prices",
    intro: "The grails: sold-out pairs, verified and resold at market price.",
    why: "When a release sells out in seconds, the resale market is where culture keeps moving. These are the pairs the OGCW desk keeps an eye on.",
    priceNote: "Guide resale prices; live prices change daily",
    hero: { src: unsplash("photo-1560769629-975ec94e6a86", 1600), alt: "A pair of colourful sneakers on a white plinth", crop: { pos: "50% 50%" } },
    site: "https://stockx.com",
    products: [
      { name: "Air Jordan 1 Retro High OG", detail: "Orange / Black / White", category: "Footwear", price: 240, image: unsplash("photo-1605510808025-707e41d39303", 800), url: search.stockx("air jordan 1 retro high og") },
      { name: "Nike Dunk Low ‘Panda’", detail: "White / Black", category: "Footwear", price: 130, image: unsplash("photo-1634624943296-54ce51cf732c", 800), url: search.stockx("dunk low panda") },
      { name: "Air Jordan 4 Retro ‘Fire Red’", detail: "White / Fire Red / Black", category: "Footwear", price: 260, image: unsplash("photo-1610897600804-c36e2336ad3a", 800), url: search.stockx("air jordan 4 fire red") },
      { name: "Air Jordan 4 Retro ‘Military Black’", detail: "White / Grey / Black", category: "Footwear", price: 290, image: unsplash("photo-1656335362192-2bc9051b1824", 800), url: search.stockx("air jordan 4 military black") },
      { name: "ASICS Gel-Kayano 14", detail: "White / Silver / Blue", category: "Footwear", price: 190, image: unsplash("photo-1575456456278-936c89ccdb7b", 800), url: search.stockx("asics gel kayano 14") },
      { name: "Air Jordan 1 High ‘University Blue’", detail: "White / University Blue / Black", category: "Footwear", price: 300, image: unsplash("photo-1693400652052-884f8dd3dfd9", 800), url: search.stockx("air jordan 1 university blue") },
    ],
  },
  {
    slug: "uniqlo",
    name: "Uniqlo",
    tagline: "Everyday essentials, done right",
    intro: "The basics under every outfit in this issue: simple, well made and fairly priced.",
    why: "Great style starts with the pieces you forget you’re wearing. Uniqlo does those better than almost anyone.",
    priceNote: "Guide retail prices",
    hero: { src: unsplash("photo-1602519095267-53c956c8cf74", 1600), alt: "The red Uniqlo sign glowing on a glass building at night", crop: { pos: "40% 70%" } },
    site: "https://www.uniqlo.com",
    products: [
      { name: "Crew Neck T-Shirt", detail: "White", category: "Clothing", price: 19.9, image: unsplash("photo-1581655353564-df123a1eb820", 800), url: "https://www.uniqlo.com" },
      { name: "Supima Cotton T-Shirt", detail: "White", category: "Clothing", price: 14.9, image: unsplash("photo-1620799139507-2a76f79a2f4d", 800), url: "https://www.uniqlo.com" },
      { name: "Puffer Jacket", detail: "Off White", category: "Clothing", price: 99.9, image: unsplash("photo-1706765779494-2705542ebe74", 800), url: "https://www.uniqlo.com" },
      { name: "Chino Trousers", detail: "Beige", category: "Clothing", price: 39.9, image: unsplash("photo-1625178494269-c91109fcc711", 800), url: "https://www.uniqlo.com" },
      { name: "Fleece Jacket", detail: "Brown", category: "Clothing", price: 49.9, image: unsplash("photo-1649937408746-4d2f603f91c8", 800), url: "https://www.uniqlo.com" },
      { name: "Shoulder Bag", detail: "Black", category: "Accessories", price: 29.9, image: unsplash("photo-1620786514684-ff35b5aae55e", 800), url: "https://www.uniqlo.com" },
    ],
  },
];

export const getShop = (slug: string) => SHOPS.find((s) => s.slug === slug);
export const formatPrice = (value: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);
export const formatDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

// ---------------------------------------------------------------- Search

export type Hit = { kind: "article"; item: Article } | { kind: "episode"; item: Episode } | { kind: "shop"; item: Shop };

/** Matches stories, episodes and shops against a query. TODO: real search endpoint. */
export function searchSite(query: string): Hit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const match = (...fields: string[]) => fields.join(" ").toLowerCase().includes(q);
  return [
    ...ARTICLES.filter((a) => match(a.title, a.deck, a.kicker, a.author, SECTIONS[a.section].label)).map((item): Hit => ({ kind: "article", item })),
    ...EPISODES.filter((e) => match(e.title, e.series, e.summary, e.kind, "originals")).map((item): Hit => ({ kind: "episode", item })),
    ...SHOPS.filter((s) => match(s.name, s.tagline, "shop", ...s.products.map((p) => `${p.name} ${p.category}`))).map((item): Hit => ({ kind: "shop", item })),
  ];
}
