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
import rosaliaPhoto from "../assets/news/rosalia-chile-2022.jpg";
import headphonesPhoto from "../assets/news/studio-headphones.jpg";
import studioPhoto from "../assets/news/recording-studio.jpg";
import foleyPhoto from "../assets/news/foley-room.jpg";
import lcdPhoto from "../assets/news/lcd-soundsystem-roskilde.jpg";
import doylePhoto from "../assets/news/al-doyle.jpg";
import stipePhoto from "../assets/news/michael-stipe-padova.jpg";
import flamingLipsPhoto from "../assets/news/flaming-lips-2017.jpg";
import leonPhoto from "../assets/news/leon-bridges.jpg";
import switchPhoto from "../assets/news/switch-2-dock.jpg";
import xboxPhoto from "../assets/news/xbox-series-x-s.jpg";
import sudaPhoto from "../assets/news/goichi-suda.jpg";
import warhammerPhoto from "../assets/news/warhammer-miniature.jpg";
import kickPhoto from "../assets/news/kick-logo.jpg";
import wwePhoto from "../assets/news/wwe-nxt-arena.jpg";
import qtPhoto from "../assets/news/qtcinderella-twitchcon.jpg";
import youtubeHqPhoto from "../assets/news/youtube-hq.jpg";
import vaccarelloPhoto from "../assets/news/anthony-vaccarello.jpg";
import tuileriesPhoto from "../assets/news/tuileries-bassin-octogonal.jpg";
import galleriaPhoto from "../assets/news/galleria-milano.jpg";
import courregesPhoto from "../assets/news/courreges-1965.jpg";
import haskinsPhoto from "../assets/news/dennis-haskins.jpg";
import { unsplash, youtubeThumb, youtubeUrl } from "./media";
import { STORY_BODIES } from "./stories";

export type Crop = { pos: string; zoom?: number };
export type Photo = { src: string; alt: string; credit?: string; crop?: Crop };
export type Source = { name: string; url: string };

export type SectionId = "music" | "games" | "streaming" | "culture" | "sports";
export const SECTIONS: Record<SectionId, { label: string; intro: string }> = {
  music: { label: "Music", intro: "New releases, tours and the awards nights everyone is talking about." },
  games: { label: "Games", intro: "Launches, sales and the showcases setting up the next few years of play." },
  streaming: { label: "Streaming", intro: "The creators, records and charity marathons that live on Twitch, YouTube and Kick." },
  culture: { label: "Culture", intro: "Fashion weeks, television, sneakers and the shows shaping the season." },
  sports: { label: "Sports", intro: "The games, records and athletes crossing over into music and fashion." },
};
export const SECTION_IDS = Object.keys(SECTIONS) as SectionId[];

// What a story's body is made of: paragraphs, subheads, pull quotes, photos
// (one, in four sizes, or two side by side), bullet lists, a key-facts box,
// a checklist ("what to prepare"), questions and answers, the questions a
// story will answer, a summary, a timeline and links to related stories.
export type ImageSize = "inline" | "wide" | "full" | "side";
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; photo: Photo; caption: string; size?: ImageSize }
  | { type: "images"; photos: [Photo, Photo]; caption: string }
  | { type: "list"; items: string[] }
  | { type: "facts"; title: string; items: [string, string][] }
  | { type: "checklist"; title: string; items: string[] }
  | { type: "faq"; items: [string, string][] }
  | { type: "link"; label: string; href: string }
  | { type: "questions"; title: string; items: string[] }
  | { type: "summary"; title: string; items: string[] }
  | { type: "timeline"; title: string; items: [string, string][] }
  | { type: "related"; title: string; slugs: string[] };

export type Article = {
  slug: string;
  section: SectionId;
  kicker: string;
  title: string;
  deck: string;
  /** Who the news comes from: the company, organisation or publication behind it, or "OGCW" for our own reporting and round-ups. Never a made-up name. */
  credit: string;
  /** The day it happened (ISO) */
  date: string;
  /** An ongoing story: the date of the latest update it reports ("Latest update: …") */
  updated?: string;
  /** Stamped CERTIFIED by the OGCW editors in the studio */
  certified?: boolean;
  /** How long the text is, in words (for sorting; not shown) */
  words: number;
  photo: Photo;
  body: Block[];
  sources: Source[];
  ask?: string; // the yes/no question at the end ("Are you going?"); "Was this helpful?" when unset
};

export { youtubeThumb, youtubeUrl, spotifyTrack } from "./media";

// Words in a story (for sorting by length)
const blockWords = (block: Block): string[] => {
  switch (block.type) {
    case "p": case "h2": case "quote": return [block.text];
    case "image": case "images": return [block.caption];
    case "list": return block.items;
    case "facts": case "timeline": return [block.title, ...block.items.flat()];
    case "checklist": case "questions": case "summary": return [block.title, ...block.items];
    case "faq": return block.items.flat();
    case "link": case "related": return [];
  }
};
export const wordCount = (body: Block[]) => body.flatMap(blockWords).join(" ").split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------- Stories (newest first)
// Each story's details are here; its full text lives in src/data/stories,
// one file per section, and its reading time is worked out from that text.

const RAW_ARTICLES: Omit<Article, "body" | "words">[] = [
  // ---- The last week of September 2026
  {
    slug: "october-2026-games",
    section: "games",
    kicker: "Release calendar",
    title: "October’s biggest games: Gears, Call of Duty on Switch 2 and Phantom Blade Zero",
    deck: "Ace Combat 8 opens the month, Gears of War goes back to E-Day and Modern Warfare 4 brings Call of Duty back to Nintendo.",
    credit: "OGCW",
    date: "2026-10-01",
    photo: { src: youtubeThumb("3ot6jdgtp4o"), alt: "A scene from the Call of Duty: Modern Warfare 4 trailer", credit: "Xbox, YouTube", crop: { pos: "50% 45%" } },
    sources: [
      { name: "Wikipedia: Gears of War: E-Day", url: "https://en.wikipedia.org/wiki/Gears_of_War:_E-Day" },
      { name: "Wikipedia: Call of Duty: Modern Warfare 4", url: "https://en.wikipedia.org/wiki/Call_of_Duty:_Modern_Warfare_4" },
      { name: "Wikipedia: Ace Combat 8: Wings of Theve", url: "https://en.wikipedia.org/wiki/Ace_Combat_8:_Wings_of_Theve" },
      { name: "Wikipedia: Phantom Blade Zero", url: "https://en.wikipedia.org/wiki/Phantom_Blade_Zero" },
      { name: "Gaming Amigos: October 2026 game launch calendar", url: "https://www.gamingamigos.com/post/october-2026-game-launch-calendar" },
    ],
  },
  {
    slug: "courreges-drew-henry-debut",
    section: "culture",
    kicker: "Paris Fashion Week",
    title: "Drew Henry breaks Courrèges out of its white box",
    deck: "The new designer’s first collection, at the Palais de Tokyo, loosened up the vinyl jackets and A-line dresses with colour, raw edges and punk spirit.",
    credit: "Vogue",
    date: "2026-10-01",
    photo: { src: courregesPhoto, alt: "A model in a white André Courrèges dress and striped top from 1965", credit: "Jacqueline Barrière Courrèges, CC BY-SA 4.0", crop: { pos: "50% 25%" } },
    sources: [
      { name: "Vogue via Yahoo: Courrèges spring 2027", url: "https://www.yahoo.com/entertainment/articles/courr-ges-spring-2027-space-194052871.html" },
      { name: "AnOther: Drew Henry is breaking out at Courrèges", url: "https://www.anothermag.com/fashion-beauty/17530/courreges-drew-henry-spring-summer-2027-review-paris-fashion-week" },
    ],
  },
  {
    slug: "netflix-october-2026",
    section: "culture",
    kicker: "Streaming guide",
    title: "New on Netflix in October: East of Eden, Lupin and The Diplomat",
    deck: "Florence Pugh leads Steinbeck’s epic on 1 October, then come Ben Affleck, Chris Evans and the return of three favourites.",
    credit: "What’s on Netflix",
    date: "2026-10-01",
    photo: { src: youtubeThumb("nI17NM1UcJQ"), alt: "The opening scene of Netflix’s East of Eden", credit: "Netflix, YouTube", crop: { pos: "50% 45%" } },
    sources: [
      { name: "What’s on Netflix: everything coming in October 2026", url: "https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-october-2026/" },
    ],
  },
  {
    slug: "saint-laurent-ss27-vaccarello",
    section: "culture",
    kicker: "Paris Fashion Week",
    title: "Saint Laurent goes gold for what may be Anthony Vaccarello’s last show",
    deck: "Ten years after his first show, an all-gold collection at the Trocadéro, a song from Charlotte Gainsbourg and a standing ovation.",
    credit: "OGCW",
    date: "2026-09-30",
    photo: { src: vaccarelloPhoto, alt: "Anthony Vaccarello in a black suit, looking down and smiling", credit: "YanRB, CC BY-SA 4.0", crop: { pos: "50% 22%" } },
    sources: [
      { name: "Numéro: The golden age according to Anthony Vaccarello", url: "https://numero.com/en/fashion/fashion-week-en/saint-laurent-spring-summer-2027-show/" },
      { name: "Stylerave: Saint Laurent spring/summer 2027", url: "https://www.stylerave.com/saint-laurent-spring-summer-2027/" },
      { name: "W Magazine: At Saint Laurent spring 2027, Vaccarello claims his golden finish", url: "https://www.wmagazine.com/fashion/saint-laurent-spring-2027-anthony-vaccarello-runway-photos" },
    ],
  },
  {
    slug: "dior-ss27-jonathan-anderson",
    section: "culture",
    kicker: "Paris Fashion Week",
    title: "At Dior, Jonathan Anderson puts a tree in a pond and lets the clothes unravel",
    deck: "His second spring collection, shown in the Tuileries, was all sheer layers, raw hems and lightness.",
    credit: "OGCW",
    date: "2026-09-30",
    photo: { src: tuileriesPhoto, alt: "The octagonal pond in the Jardin des Tuileries with a fountain and green chairs", credit: "Chabe01, CC BY-SA 4.0", crop: { pos: "50% 55%" } },
    sources: [
      { name: "Coveteur: The lightness of being at Dior spring/summer 2027", url: "https://coveteur.com/dior-ss27-review" },
      { name: "Whitewall: Dior spring/summer 2027", url: "https://whitewall.art/fashion/dior-jonathan-anderson-spring-summer-2027/" },
    ],
  },
  {
    slug: "lcd-soundsystem-nyc-residency-100th-show",
    section: "music",
    kicker: "Live",
    title: "LCD Soundsystem book 12 New York nights, with their 100th residency show for charity",
    deck: "Three weekends at the Knockdown Center and Brooklyn Steel. All the ticket money from 30 November goes to charity.",
    credit: "Stereogum",
    date: "2026-09-30",
    photo: { src: lcdPhoto, alt: "LCD Soundsystem on stage at Roskilde Festival, synths and lights around them", credit: "Bill Ebbesen, CC BY 3.0", crop: { pos: "50% 45%" } },
    sources: [
      { name: "Stereogum: LCD Soundsystem announce 100th NYC residency show", url: "https://stereogum.com/2513151/lcd-soundsystem-announce-100th-nyc-residency-show-al-doyle-announces-debut-solo-album-hollywood-saviour/news" },
      { name: "JamBase: LCD Soundsystem NYC residency 2026", url: "https://www.jambase.com/article/lcd-soundsystem-nyc-residency-2026-100th-show" },
    ],
  },
  {
    slug: "al-doyle-hollywood-saviour",
    section: "music",
    kicker: "New music",
    title: "Al Doyle announces his first solo album, Hollywood Saviour",
    deck: "The LCD Soundsystem and Hot Chip guitarist releases it on DFA on 20 November. “Hard Times in America” is out now.",
    credit: "Stereogum",
    date: "2026-09-30",
    photo: { src: doylePhoto, alt: "Al Doyle playing guitar on stage in warm light", credit: "Kim Metso, CC BY-SA 3.0", crop: { pos: "35% 40%" } },
    sources: [
      { name: "Stereogum: Al Doyle announces debut solo album Hollywood Saviour", url: "https://stereogum.com/2513151/lcd-soundsystem-announce-100th-nyc-residency-show-al-doyle-announces-debut-solo-album-hollywood-saviour/news" },
    ],
  },
  {
    slug: "rem-reveal-25th-anniversary",
    section: "music",
    kicker: "Reissues",
    title: "R.E.M. reissue Reveal for its 25th birthday, with an unreleased Paris session",
    deck: "A 17-song set recorded for Radio France in May 2001 headlines the anniversary edition, out on 20 November.",
    credit: "R.E.M.",
    date: "2026-09-30",
    photo: { src: stipePhoto, alt: "Michael Stipe singing on stage in Padova in 2003, one arm raised", credit: "Stefano Andreoli, CC BY-SA 2.0", crop: { pos: "50% 40%" } },
    sources: [
      { name: "REMHQ: Reveal 25th anniversary edition coming 20 November", url: "https://remhq.com/news/reveal-25th-anniversary-edition-coming-november-20th/" },
      { name: "NME: R.E.M. announce Reveal 25th anniversary reissue", url: "https://www.nme.com/news/music/r-e-m-reveal-25th-anniversary-reissue-previously-unreleased-live-session-3971667" },
      { name: "Wikipedia: Reveal (R.E.M. album)", url: "https://en.wikipedia.org/wiki/Reveal_(R.E.M._album)" },
    ],
  },
  {
    slug: "shadow-of-mordor-shadow-of-war-switch-2",
    section: "games",
    kicker: "Switch 2",
    title: "Shadow of Mordor and Shadow of War are out on Switch 2",
    deck: "Aspyr’s Middle-earth: Shadow Bundle brings both complete editions, and the Nemesis System, to a Nintendo console for the first time.",
    credit: "OGCW",
    date: "2026-09-30",
    photo: { src: youtubeThumb("HmIdzplCp-o"), alt: "Artwork from the Middle-earth: Shadow Bundle trailer for Nintendo Switch 2", credit: "Nintendo of America, YouTube", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Techloy: Shadow of Mordor and Shadow of War come to Switch 2 on 30 September", url: "https://www.techloy.com/shadow-of-mordor-shadow-of-war-switch-2/" },
      { name: "GamerHub: Aspyr brings the Shadow Bundle to Switch 2", url: "https://gamerhub.co.uk/aspyr-brings-shadow-of-mordor-and-shadow-of-war-to-switch-2-in-sept-30-bundle" },
      { name: "YouTube: Middle-earth: Shadow Bundle pre-order trailer", url: youtubeUrl("HmIdzplCp-o") },
    ],
  },
  {
    slug: "xbox-disc-to-digital-all-players",
    section: "games",
    kicker: "Xbox",
    title: "Xbox now turns your game discs into digital copies, for free",
    deck: "Disc-to-Digital is open to every player. More than 1,500 games work, but you may lose the licence if you sell the disc.",
    credit: "Xbox",
    date: "2026-09-30",
    photo: { src: xboxPhoto, alt: "An Xbox Series X and Series S on a shop display", credit: "Kyu3a, CC BY-SA 4.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Game Informer: Xbox Disc-to-Digital program now available for all players", url: "https://gameinformer.com/2026/09/30/xbox-disc-to-digital-program-now-available-for-all-players" },
      { name: "Pure Xbox: Disc to Digital is now live for everyone", url: "https://www.purexbox.com/news/2026/09/xbox-disc-to-digital-is-now-live-for-everyone-but-you-may-need-to-force-it-through" },
    ],
  },
  {
    slug: "grasshopper-manufacture-leaves-netease",
    section: "games",
    kicker: "Industry",
    title: "Suda51’s Grasshopper Manufacture is independent again",
    deck: "The No More Heroes studio has split from NetEase, five years and one game after the takeover.",
    credit: "Grasshopper Manufacture",
    date: "2026-09-30",
    photo: { src: sudaPhoto, alt: "Goichi Suda, known as Suda51, speaking into a microphone", credit: "Georges Seguin (Okki), CC BY-SA 3.0", crop: { pos: "50% 35%" } },
    sources: [
      { name: "Game Informer: Grasshopper Manufacture leaves NetEase", url: "https://gameinformer.com/2026/09/30/suda51s-grasshopper-manufacture-leaves-netease-is-independent-studio-again-months-after" },
      { name: "Wikipedia: Grasshopper Manufacture", url: "https://en.wikipedia.org/wiki/Grasshopper_Manufacture" },
    ],
  },
  {
    slug: "dawn-of-war-iv-space-marines-trailer",
    section: "games",
    kicker: "Trailer",
    title: "Dawn of War IV’s Space Marines trailer brings the Blood Ravens back to Kronus",
    deck: "A CGI trailer teams them up with the Dark Angels, two months before the strategy game launches on 3 December.",
    credit: "OGCW",
    date: "2026-09-30",
    photo: { src: warhammerPhoto, alt: "A man in glasses painting a small Warhammer 40,000 miniature", credit: "David Poe, US Air Force, public domain", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Worthplaying: Dawn of War IV shows off the Blood Ravens and Dark Angels", url: "https://worthplaying.com/article/2026/9/30/news/151114-warhammer-40000-dawn-of-war-iv-shows-off-blood-ravens-and-dark-angels-fighting-side-by-side-in-latest-cinematic-trailer/" },
      { name: "Bleeding Cool: Dawn of War IV pushed to 3 December", url: "https://bleedingcool.com/games/warhammer-40000-dawn-of-war-iv-launch-pushed-to-december-3rd/" },
      { name: "Wikipedia: Warhammer 40,000: Dawn of War IV", url: "https://en.wikipedia.org/wiki/Warhammer_40,000:_Dawn_of_War_IV" },
    ],
  },
  {
    slug: "flaming-lips-at-war-with-the-mystics-20th",
    section: "music",
    kicker: "Reissues",
    title: "The Flaming Lips open the vaults for At War with the Mystics",
    deck: "The 20th anniversary edition, out on 13 November, adds 33 unreleased demos and studio recordings to the Grammy-winning album.",
    credit: "The Flaming Lips",
    date: "2026-09-29",
    photo: { src: flamingLipsPhoto, alt: "Wayne Coyne singing under purple and blue stage lights with confetti", credit: "dom fellowes, CC BY 2.0", crop: { pos: "50% 35%" } },
    sources: [
      { name: "NME: The Flaming Lips announce At War with the Mystics reissue", url: "https://www.nme.com/news/music/the-flaming-lips-at-war-with-the-mystics-20th-anniversary-reissue-unreleased-songs-3971523" },
      { name: "Dork: At War with the Mystics 20th anniversary edition", url: "https://readdork.com/news/flaming-lips-at-war-with-the-mystics-20th-anniversary-edition-a77838cc0b" },
      { name: "Wikipedia: At War with the Mystics", url: "https://en.wikipedia.org/wiki/At_War_with_the_Mystics" },
    ],
  },
  {
    slug: "dennis-haskins-dies",
    section: "culture",
    kicker: "Obituary",
    title: "Dennis Haskins, Saved by the Bell’s Mr. Belding, dies at 75",
    deck: "He played Bayside’s principal for 13 years, from Good Morning, Miss Bliss to the end of The New Class.",
    credit: "Deadline",
    date: "2026-09-29",
    photo: { src: haskinsPhoto, alt: "Dennis Haskins smiling at an event in a dark shirt", credit: "Lucha VaVOOM, CC BY 2.0", crop: { pos: "50% 18%" } },
    sources: [
      { name: "Deadline: Dennis Haskins dies", url: "https://deadline.com/2026/09/dennis-haskins-dead-saved-by-the-bell-mr-belding-1237115941/" },
      { name: "Wikipedia: Dennis Haskins", url: "https://en.wikipedia.org/wiki/Dennis_Haskins" },
    ],
  },
  {
    slug: "coyote-vs-acme-digital-release",
    section: "culture",
    kicker: "Film",
    title: "Coyote vs. Acme, the film that was almost a tax write-off, is now out at home",
    deck: "After $110 million worldwide and 96% on Rotten Tomatoes, the Looney Tunes comedy is available to buy digitally.",
    credit: "OGCW",
    date: "2026-09-29",
    photo: { src: youtubeThumb("Bpg3tJ4f3v0"), alt: "Wile E. Coyote in a frame from the Coyote vs. Acme final trailer", credit: "Ketchup Entertainment, YouTube", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Wikipedia: Coyote vs. Acme", url: "https://en.wikipedia.org/wiki/Coyote_vs._Acme" },
      { name: "IndieWire: Coyote vs. Acme grosses $100 million worldwide", url: "https://www.indiewire.com/news/box-office/coyote-vs-acme-tax-write-off-100-million-box-office-1235218061/" },
      { name: "Collider: Coyote vs. Acme digital release date", url: "https://collider.com/coyote-vs-acme-digital-release-date-september-2026/" },
    ],
  },
  {
    slug: "lego-one-piece-netflix",
    section: "culture",
    kicker: "TV",
    title: "LEGO ONE PIECE is on Netflix, with the live-action cast as minifigures",
    deck: "Usopp retells the first two seasons to Chopper, his way, in a two-part animated special.",
    credit: "Netflix",
    date: "2026-09-29",
    photo: { src: youtubeThumb("6OP_KhnmUus"), alt: "LEGO minifigures of the Straw Hat crew in the LEGO ONE PIECE trailer", credit: "ONE PIECE Official, YouTube", crop: { pos: "50% 45%" } },
    sources: [
      { name: "What’s on Netflix: LEGO ONE PIECE trailer and cast", url: "https://www.whats-on-netflix.com/news/lego-one-piece-netflix-release-date-trailer-cast/" },
      { name: "What’s on Netflix: One Piece is getting a LEGO adaptation", url: "https://www.whats-on-netflix.com/news/one-piece-getting-a-lego-tv-adaptation-in-september-2026/" },
      { name: "YouTube: LEGO ONE PIECE official trailer", url: youtubeUrl("6OP_KhnmUus") },
    ],
  },
  {
    slug: "streamer-awards-2026-applications",
    section: "streaming",
    kicker: "Awards",
    title: "The Streamer Awards 2026: apply by 2 October, vote from 16 October",
    deck: "For the first time creators can put themselves forward. The show, with KATSEYE performing, is on 12 November.",
    credit: "Twitch",
    date: "2026-09-29",
    photo: { src: qtPhoto, alt: "QTCinderella and Maya Higa speaking on a TwitchCon stage", credit: "LeahBeahReah, CC BY-SA 4.0", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Twitch: How to apply for the 2026 Streamer Awards", url: "https://blog.twitch.tv/en/2026/08/31/how-to-apply-for-the-2026-streamer-awards/" },
      { name: "Sportskeeda: Streamer Awards 2026 categories and how to apply", url: "https://www.sportskeeda.com/us/streamers/news-streamer-awards-2026-nomination-categories-apply" },
    ],
  },
  {
    slug: "switch-2-calendar-september-direct",
    section: "games",
    kicker: "Switch 2",
    title: "Your Switch 2 calendar: every date from the September Direct",
    deck: "Resident Evil in October, Monster Hunter in December, Metroid Ravenous in January. Here it all is, in order.",
    credit: "Nintendo",
    date: "2026-09-28",
    photo: { src: switchPhoto, alt: "A Nintendo Switch 2 standing in its black dock", credit: "Crisco 1492, CC BY-SA 4.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Game Informer: Every new announcement at the September 2026 Nintendo Direct", url: "https://gameinformer.com/nintendo-direct/2026/09/09/every-new-announcement-at-the-september-2026-nintendo-direct" },
      { name: "GamesRadar+: Everything announced at the Nintendo Direct September 2026", url: "https://www.gamesradar.com/news/live/nintendo-direct-september-2026-everything-announced/" },
    ],
  },
  {
    slug: "milan-fashion-week-ss27-review",
    section: "culture",
    kicker: "Fashion",
    title: "Milan Fashion Week: Prada’s skirts, Demna’s Gucci shop and Moschino on a car-park roof",
    deck: "The best of spring/summer 2027 in Milan, and the trends to take away.",
    credit: "OGCW",
    date: "2026-09-28",
    photo: { src: galleriaPhoto, alt: "The glass-roofed arcade of the Galleria Vittorio Emanuele II in Milan", credit: "Maurizio Moro5153, CC BY-SA 4.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Wallpaper*: The standout shows of Milan Fashion Week S/S 2027", url: "https://www.wallpaper.com/fashion-beauty/best-shows-milan-fashion-week-ss-2027-review-round-up" },
      { name: "W Magazine: 8 things we saw and loved at Milan Fashion Week spring 2027", url: "https://www.wmagazine.com/fashion/milan-fashion-week-spring-2027-recap" },
      { name: "Luxus Plus: Milan Fashion Week highlights", url: "https://luxus-plus.com/en/milan-fashion-week-farewells-debuts-and-major-events/" },
    ],
  },
  {
    slug: "monster-hunter-wilds-switch-2",
    section: "games",
    kicker: "Switch 2",
    title: "Monster Hunter Wilds comes to Switch 2 on 4 December",
    deck: "Every update is included and local play is in. The Ascendance expansion follows in 2027.",
    credit: "Capcom",
    date: "2026-09-27",
    photo: { src: youtubeThumb("iNru7mV044Y"), alt: "A frame from the Monster Hunter Wilds: Ascendance trailer", credit: "Capcom, YouTube", crop: { pos: "18% 45%" } },
    sources: [
      { name: "Game Informer: Monster Hunter Wilds hits Nintendo Switch 2 this December", url: "https://gameinformer.com/nintendo-direct/2026/09/09/monster-hunter-wilds-hits-nintendo-switch-2-this-december" },
      { name: "GamingBolt: Monster Hunter Wilds is coming to Switch 2 on 4 December", url: "https://gamingbolt.com/monster-hunter-wilds-is-coming-to-nintendo-switch-2-on-december-4th" },
      { name: "YouTube: Monster Hunter Wilds: Ascendance, TGS 2026 trailer", url: youtubeUrl("iNru7mV044Y") },
    ],
  },
  {
    slug: "intergalactic-quiet-until-2027",
    section: "games",
    kicker: "PlayStation",
    title: "Naughty Dog goes quiet on Intergalactic until 2027",
    deck: "Neil Druckmann promised a proper look next year, shared new art and confirmed more The Last of Us projects.",
    credit: "Naughty Dog",
    date: "2026-09-27",
    photo: { src: youtubeThumb("VLGy63pt9vA"), alt: "A frame from the Intergalactic: The Heretic Prophet announcement trailer", credit: "PlayStation, YouTube", crop: { pos: "50% 40%" } },
    sources: [
      { name: "Push Square: No Intergalactic updates until 2027", url: "https://www.pushsquare.com/news/2026/09/no-intergalactic-ps5-updates-until-2027-new-artwork-for-now" },
      { name: "Naughty Dog: Announcing Intergalactic: The Heretic Prophet", url: "https://www.naughtydog.com/blog/intergalactic_the_heretic_prophet_announcement" },
    ],
  },
  {
    slug: "sony-music-joins-ariam",
    section: "music",
    kicker: "AI & music",
    title: "Sony Music becomes the first music company in the AI coalition ARIAM",
    deck: "The alliance already counts Disney, the BBC and The New York Times. Sony joins while suing two AI music start-ups.",
    credit: "Variety",
    date: "2026-09-26",
    photo: { src: studioPhoto, alt: "A large recording studio with a grand piano, drum kit and wooden walls", credit: "Will Fisher, CC BY-SA 2.0", crop: { pos: "50% 55%" } },
    sources: [
      { name: "CelebrityAccess: Sony Music Group joins AI coalition ARIAM", url: "https://celebrityaccess.com/2026/09/25/sony-music-group-becomes-first-music-company-to-join-ai-coalition-ariam/" },
      { name: "Variety: Sony Music Group joins AI content coalition ARIAM", url: "https://variety.com/2026/music/news/sony-music-group-joins-ai-content-coalition-ariam-1236873137/" },
    ],
  },
  {
    slug: "new-albums-25-september-2026",
    section: "music",
    kicker: "New music",
    title: "New music Friday: Leon Bridges, Julia Jacklin, Tinashe and a very busy 25 September",
    deck: "More than 50 albums in one day, from soul and indie to country, metal and the Joy Division archive.",
    credit: "OGCW",
    date: "2026-09-26",
    photo: { src: leonPhoto, alt: "Leon Bridges and his band on stage at Webster Hall under red curtains", credit: "Brianga, CC BY-SA 4.0", crop: { pos: "50% 55%" } },
    sources: [
      { name: "2 Loud 2 Old Music: Friday new releases, 25 September 2026", url: "https://2loud2oldmusic.com/2026/09/25/friday-new-releases-september-25-2026/" },
      { name: "Saving Country Music: 25 September 2026 release guide", url: "https://savingcountrymusic.com/september-25th-2026-is-a-super-busy-release-day-heres-your-guide/" },
    ],
  },
  {
    slug: "ea-sports-fc-27-launch",
    section: "games",
    kicker: "Launch",
    title: "EA Sports FC 27 is out, with Mbappé on every cover",
    deck: "The football game launched on 25 September on nine platforms, alongside a free FC 27 Lite.",
    credit: "EA Sports",
    date: "2026-09-25",
    photo: { src: youtubeThumb("nsIVAUwke3o"), alt: "A frame from the EA Sports FC 27 launch trailer for Nintendo Switch 2", credit: "Nintendo of America, YouTube", crop: { pos: "50% 45%" } },
    sources: [
      { name: "EA: Kylian Mbappé and Jude Bellingham welcome you to EA Sports FC 27", url: "https://news.ea.com/press-releases/press-releases-details/2026/Kylian-Mbapp-and-Jude-Bellingham-Welcome-You-to-EA-SPORTS-FC-27-Launching-Worldwide-on-September-25/default.aspx" },
      { name: "EA: FC 27 editions and release dates", url: "https://www.ea.com/games/ea-sports-fc/fc-27/news/fc-27-editions-and-release-dates" },
      { name: "YouTube: EA Sports FC 27 launch trailer, Nintendo Switch 2", url: youtubeUrl("nsIVAUwke3o") },
    ],
  },
  {
    slug: "qobuz-ai-music-tags",
    section: "music",
    kicker: "AI & music",
    title: "Qobuz now tells you when a song was made by AI",
    deck: "The streaming service labels AI-generated releases, and says most streams of those tracks are fraudulent.",
    credit: "Qobuz",
    date: "2026-09-25",
    photo: { src: headphonesPhoto, alt: "A pair of silver and black studio headphones resting on a notebook", credit: "Melissa Ursula Dawn Goldsmith, CC BY-SA 4.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Digital Music News: Qobuz rolls out a tag to flag AI-generated music", url: "https://www.digitalmusicnews.com/2026/09/24/qobuz-tags-ai-generated-music/" },
      { name: "Trusted Reviews: Qobuz is making it clear which music is AI-produced", url: "https://www.trustedreviews.com/news/qobuz-is-making-it-clear-which-music-is-ai-produced-on-its-service" },
    ],
  },
  {
    slug: "professional-sound-alliance-launch",
    section: "music",
    kicker: "AI & music",
    title: "Sound designers form the Professional Sound Alliance to fight AI scraping",
    deck: "Effects libraries and Oscar-winning sound editors want the same protection music and voice already have.",
    credit: "Professional Sound Alliance",
    date: "2026-09-25",
    photo: { src: foleyPhoto, alt: "A sound artist recording footsteps with a bowling ball in a Foley room", credit: "Vancouver Film School, CC BY 2.0", crop: { pos: "50% 45%" } },
    sources: [
      { name: "Music Business Worldwide: Sound designers launch the Professional Sound Alliance", url: "https://www.musicbusinessworldwide.com/sound-designers-and-sfx-libraries-launch-professional-sound-alliance-to-fight-ai-scraping-now-sound-will-have-protection-of-our-own/" },
      { name: "Professional Sound Alliance", url: "https://professionalsoundalliance.org/" },
    ],
  },
  {
    slug: "wwe-main-event-moves-to-rumble",
    section: "streaming",
    kicker: "Platforms",
    title: "WWE moves Main Event from YouTube to Rumble",
    deck: "From 14 October the weekly show airs on Wednesdays at 8pm ET, head to head with AEW Dynamite.",
    credit: "POST Wrestling",
    date: "2026-09-25",
    photo: { src: wwePhoto, alt: "A WWE NXT ring and entrance stage lit up in a dark arena", credit: "InFlamester20, CC BY-SA 4.0", crop: { pos: "50% 45%" } },
    sources: [
      { name: "POST Wrestling: WWE Main Event to move from YouTube to Rumble", url: "https://www.postwrestling.com/2026/09/24/wwe-main-event-to-move-from-youtube-to-rumble-beginning-oct-14/" },
      { name: "Yahoo Sports: WWE moves Main Event to Rumble", url: "https://sports.yahoo.com/articles/wwe-moves-main-event-wing-210043474.html" },
    ],
  },
  {
    slug: "made-on-youtube-2026",
    section: "streaming",
    kicker: "YouTube",
    title: "Made on YouTube 2026: Live Showdowns, AI help in Studio and a new way to earn",
    deck: "More than 30 announcements for creators, from split-screen live battles to live dubbing and Shorts series.",
    credit: "YouTube",
    date: "2026-09-24",
    photo: { src: youtubeHqPhoto, alt: "The glass entrance of YouTube’s headquarters in San Bruno, California", credit: "BrokenSphere, CC BY 3.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "TechCrunch: YouTube releases new AI features for creators in Studio", url: "https://techcrunch.com/2026/09/23/youtube-releases-new-ai-features-for-creators-within-its-studio-app/" },
      { name: "Upstream: Made on YouTube 2026, what’s new for live streamers", url: "https://upstream.so/blog/made-on-youtube-2026/" },
    ],
  },
  {
    slug: "kick-partner-program-payout-fix",
    section: "streaming",
    kicker: "Platforms",
    title: "Kick admits a payout error, sends backpay and changes how streamers are paid",
    deck: "A calculation mistake left partners short in September. Rates are now set across several streams, not one.",
    credit: "Streams Charts",
    date: "2026-09-23",
    photo: { src: kickPhoto, alt: "The Kick logo in white on black", credit: "Kick, CC BY-SA 4.0", crop: { pos: "50% 50%" } },
    sources: [
      { name: "Streams Charts: Kick revises partner payouts after September errors", url: "https://streamscharts.com/news/kick-revises-kpp-september-2026-update" },
    ],
  },
  {
    slug: "latin-grammys-2026-nominations",
    section: "music",
    kicker: "Awards",
    title: "Latin Grammys 2026: Edgar Barrera leads, with Rosalía and Karol G close behind",
    deck: "The producer has 10 nominations; four acts have seven. The winners are named in Las Vegas on 12 November.",
    credit: "Latin Recording Academy",
    date: "2026-09-17",
    photo: { src: rosaliaPhoto, alt: "Rosalía singing into a microphone on stage in a black and gold jacket", credit: "Andrés Ibarra, CC BY-SA 4.0", crop: { pos: "50% 30%" } },
    sources: [
      { name: "Wikipedia: 27th Annual Latin Grammy Awards", url: "https://en.wikipedia.org/wiki/27th_Annual_Latin_Grammy_Awards" },
      { name: "Rolling Stone: Latin Grammy nominations 2026", url: "https://www.rollingstone.com/music/music-latin/latin-grammy-nominations-2026-1235623634/" },
      { name: "Complex: 2026 Latin Grammys nominations", url: "https://www.complex.com/music/a/alex-ocho/latin-grammys-2026-nominations-karol-g-rosalia-ca7riel-paco-amoroso" },
    ],
  },
  // ---- Earlier in September 2026
  {
    slug: "rap-number-ones-2026",
    section: "music",
    kicker: "The rap desk",
    title: "Five rappers, five number ones: hip-hop’s 2026 so far",
    deck: "A record Grammy night, three albums in the top three at once and a 12th number one. The case for each name in our No. 1 rapper vote.",
    credit: "OGCW",
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
    credit: "OGCW",
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
    credit: "Rockstar Games",
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
    credit: "CD Projekt Red",
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
    credit: "Mojang Studios",
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
    credit: "MTV",
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
    credit: "Fédération de la Haute Couture et de la Mode",
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
    credit: "Deadline",
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
    credit: "OGCW",
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
    credit: "House of Heat",
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
    credit: "OGCW",
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
    credit: "OGCW",
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
    credit: "DualShockers",
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
    credit: "Mercury Prize",
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
    credit: "OGCW",
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
    credit: "OGCW",
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
    credit: "OGCW",
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
    credit: "Kotaku",
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
    credit: "Xbox Wire",
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
    credit: "Television Academy",
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
    credit: "La Biennale di Venezia",
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
    credit: "Blizzard Entertainment",
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
    credit: "NBC New York",
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
    credit: "Streams Charts",
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
    credit: "Twitch",
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
    credit: "Streams Charts",
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
    credit: "OGCW",
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
    credit: "OGCW",
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
    credit: "PlayStation",
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
    credit: "NBC News",
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
    credit: "Streams Charts",
    date: "2026-08-13",
    photo: { src: kaiPhoto, alt: "Kai Cenat in a black durag, speaking outdoors", credit: "ImDavisss Live, CC BY 3.0", crop: { pos: "50% 28%" } },
    sources: [
      { name: "Streams Charts: Kai Cenat & IShowSpeed Minecraft marathon recap", url: "https://streamscharts.com/news/kai-cenat-ishowspeed-2026-minecraft-marathon-recap" },
    ],
  },
];

// Newest first; stories from the same day keep the order they are listed in
export const ARTICLES: Article[] = [...RAW_ARTICLES].sort((a, b) => b.date.localeCompare(a.date)).map((story) => {
  const full = STORY_BODIES[story.slug];
  const body = full?.body ?? [];
  return { ...story, body, words: wordCount(body), ...(full?.ask ? { ask: full.ask } : {}) };
});

// The stories as written in the code. The site shows the live versions
// from the Sanity studio (/admin) and falls back to these only when Sanity
// can't be reached: pages get stories through useStories()
// (src/lib/stories.tsx), not from here.
export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);

// Curated orders used across the site, by web address. A story that has
// been removed in the studio drops out of its list.
export const LIST_SLUGS = {
  trending: ["gta-vi-countdown", "vmas-2026-winners", "onimusha-way-of-the-sword-launch", "miley-cyrus-bass-persuades-number-one", "avengers-endgame-encore-box-office"],
  mostRead: ["vmas-2026-winners", "gta-vi-countdown", "taylor-swift-the-life-of-a-showgirl-the-encore", "emmys-2026-winners", "z-event-2026-final-edition"],
  editorsPicks: ["paris-fashion-week-ss27", "tokyo-game-show-2026-typhoon", "blizzcon-2026-diablo-v-starcraft", "twitch-state-of-gaming-2026", "bts-arirang-world-tour-latin-america"],
  featured: ["vmas-2026-winners", "paris-fashion-week-ss27", "gta-vi-countdown", "z-event-2026-final-edition", "taylor-swift-the-life-of-a-showgirl-the-encore"],
};

export const READING_LIST_SLUGS = [
  { id: "pop-week", title: "Pop’s big week", note: "The VMAs, a Taylor Swift encore and BTS on the road.", items: ["vmas-2026-winners", "taylor-swift-the-life-of-a-showgirl-the-encore", "bts-arirang-world-tour-latin-america"] },
  { id: "games-to-watch", title: "Games to watch", note: "Launches, delays and the showcases setting up 2027.", items: ["gta-vi-countdown", "marvels-wolverine-sales", "blizzcon-2026-diablo-v-starcraft"] },
  { id: "live-on-stream", title: "Live on stream", note: "Records, marathons and the numbers behind Twitch.", items: ["z-event-2026-final-edition", "wardogs-launch-theburntpeanut", "twitch-state-of-gaming-2026"] },
];
export type ReadingList = { id: string; title: string; note: string; cover?: Photo; items: Article[] };

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
  { date: "2026-10-23", end: "2026-10-24", category: "Music", title: "Jay-Z at SoFi Stadium", detail: "The JAY-Z 30 Tour finale", slug: "jay-z-30-tour-sofi-finale" },
  { date: "2026-10-20", category: "Games", title: "Hearthstone: Reign of the Black Empire", detail: "The next expansion, announced at BlizzCon", slug: "blizzcon-2026-diablo-v-starcraft" },
  { date: "2026-10-22", category: "Music", title: "Mercury Prize 2026", detail: "The winner is named live in Newcastle", slug: "mercury-prize-2026-shortlist" },
  { date: "2026-10-23", category: "Film", title: "Klara and the Sun", detail: "Taika Waititi adapts Kazuo Ishiguro’s novel" },
  { date: "2026-11-04", category: "Games", title: "World of Warcraft: Forever", detail: "Blizzard’s new way to play launches", slug: "blizzcon-2026-diablo-v-starcraft" },
  { date: "2026-11-06", category: "Music", title: "Lil Baby’s new album", detail: "The date he posted on 2 October; title still to come", slug: "lil-baby-new-album-november-6" },
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
  { artist: "Cardi B feat. Kehlani", title: "Safe", album: "AM I THE DRAMA?", year: 2025, note: "Best Hip-Hop at the 2026 VMAs.", spotify: "5q9I5RmmrLC4U2mW2BnF3K", cover: spotifyCover("4449c12628ef639dd6500c4a") },
  { artist: "Taylor Swift", title: "Patient Zero", album: "The Life of a Showgirl: The Encore", year: 2026, note: "The lead single from The Life of a Showgirl: The Encore, out 25 September.", spotify: "49JeKZqejPtqJKpK7x9Ew4", cover: spotifyCover("b2de0f5e12f0b369fde79953") },
  { artist: "BTS", title: "Swim", album: "ARIRANG", year: 2026, note: "Song of the Year at the 2026 VMAs, and the centrepiece of the Arirang tour.", spotify: "68lbSrXDORS51pmyjZv712", cover: spotifyCover("dfa17fad7f190c901603270e") },
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
// A day, shown in UTC so it reads the same in every time zone (and on the server)
export const formatDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

// ---------------------------------------------------------------- Search

export type Hit = { kind: "article"; item: Article } | { kind: "episode"; item: Episode } | { kind: "shop"; item: Shop };

/** Matches stories (the live list from useStories()), episodes and shops against a query */
export function searchSite(query: string, stories: Article[]): Hit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const match = (...fields: string[]) => fields.join(" ").toLowerCase().includes(q);
  return [
    ...stories.filter((a) => match(a.title, a.deck, a.kicker, a.credit, SECTIONS[a.section].label)).map((item): Hit => ({ kind: "article", item })),
    ...EPISODES.filter((e) => match(e.title, e.series, e.summary, e.kind, "originals")).map((item): Hit => ({ kind: "episode", item })),
    ...SHOPS.filter((s) => match(s.name, s.tagline, "shop", ...s.products.map((p) => `${p.name} ${p.category}`))).map((item): Hit => ({ kind: "shop", item })),
  ];
}
