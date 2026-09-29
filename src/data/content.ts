// OGCW content library: every story, Originals episode and shop on the site.
// Pages, the home page, the header menu, the drawer, search and the footer all
// read from here, so a story added once shows up everywhere it should.
// TODO: this becomes the admin panel / CMS later.
import centralCeePhoto from "../assets/central-cee.jpg";
import davePhoto from "../assets/dave.jpg";
import styleHero from "../assets/ogcw-hero-style.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";
import vedanPhoto from "../assets/vedan.jpg";
import cartiPhoto from "../assets/playboi-carti.jpg";
import rogaPhoto from "../assets/roga-roga.jpg";
import drakePhoto from "../assets/drake.jpg";

export type Crop = { pos: string; zoom?: number };
export type Photo = { src: string; alt: string; credit?: string; crop?: Crop };

export type SectionId = "music" | "culture";
export const SECTIONS: Record<SectionId, { label: string; intro: string }> = {
  music: { label: "Music", intro: "Rap, rumba and everything between: the artists, scenes and records moving culture right now." },
  culture: { label: "Culture", intro: "Style, design, nightlife, architecture and print, and the people who make them matter." },
};

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; photo: Photo; caption: string };

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
};

const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const TICKETS = { drake: "https://www.ticketmaster.com/search?q=drake" }; // TODO: real ticket link
export { drakePhoto };

// ---------------------------------------------------------------- Stories

export const ARTICLES: Article[] = [
  {
    slug: "central-cee-and-the-global-rise-of-uk-rap",
    section: "music",
    kicker: "Music",
    title: "Central Cee and the global rise of UK rap",
    deck: "From “Sprinter” to “Band4Band”, how the West London rapper carried British drill from the estate to the world stage.",
    author: "Jonah Reyes",
    date: "2026-09-25",
    read: "7 min read",
    photo: { src: centralCeePhoto, alt: "Central Cee on stage in a monogrammed knit vest and a cap covered in flag patches", credit: "200izo, CC BY-SA 4.0", crop: { pos: "50% 18%" } },
    body: [
      { type: "p", text: "There was a time when a UK rap record crossing the Atlantic felt like a novelty, a one-off that proved the rule. Central Cee has spent the last few years quietly taking that rule apart. The West London rapper built his audience the modern way: short, sharp verses, a steady run of releases and a sense of timing that turned clips into moments." },
      { type: "p", text: "His sound comes out of UK drill, but it has never been bound by it. The flows are conversational, the hooks are built for repetition and the references travel. That combination is why a line recorded in London can be quoted in Paris, Lagos and Toronto in the same week." },
      { type: "h2", text: "The records that changed the scale" },
      { type: "p", text: "“Sprinter”, his 2023 collaboration with Dave, became one of the biggest British rap singles in years, a song that stayed at the top of the charts long after the first wave of hype had passed. A year later, “Band4Band” with Lil Baby put him in front of an American audience that had rarely made room for UK voices." },
      { type: "quote", text: "His records never tried to sound American. They sound like London, and the world listens anyway." },
      { type: "image", photo: { src: musicHero, alt: "A singer under a single spotlight in front of a packed crowd", crop: { pos: "40% 40%" } }, caption: "UK rap’s audience now stretches far beyond the city that made it." },
      { type: "p", text: "What makes his rise feel significant is what it opened up for others. Promoters book differently, labels listen differently, and younger artists can see a route that doesn’t ask them to soften their accent or their subject matter." },
      { type: "h2", text: "What comes next" },
      { type: "p", text: "The question now is less whether UK rap can travel and more what it does once it arrives. For a generation raised on his verses, the answer looks obvious: keep the specifics, keep the slang, and let the world catch up." },
    ],
  },
  {
    slug: "vedan-and-the-reach-of-regional-rap",
    section: "music",
    kicker: "New voices",
    title: "Vedan and the reach of regional rap",
    deck: "How a Malayalam rapper from Kerala turned local stories into a voice heard far beyond the region.",
    author: "Sana Lind",
    date: "2026-09-24",
    read: "5 min read",
    photo: { src: vedanPhoto, alt: "Vedan performing under red stage lights", crop: { pos: "50% 30%" } },
    body: [
      { type: "p", text: "Regional rap used to be treated as a footnote to the scenes in the big cities. Vedan is one of the artists making that framing look out of date. Rapping in Malayalam, the Kerala artist writes about the lives around him with a directness that needs no translation to land." },
      { type: "p", text: "His verses return again and again to labour, caste and the people who are usually left out of the story. It’s protest music in the oldest sense, but delivered with the energy of a festival headliner." },
      { type: "quote", text: "The more specific the story, the further it seems to travel." },
      { type: "h2", text: "From shares to stages" },
      { type: "p", text: "His early independent releases spread through shares and word of mouth long before any industry push. Crowds now know every line, and the shows have the feeling of a community gathering as much as a concert." },
      { type: "image", photo: { src: vedanPhoto, alt: "Vedan on stage, microphone raised", crop: { pos: "50% 60%" } }, caption: "Vedan’s shows feel like a community gathering as much as a concert." },
      { type: "p", text: "What Vedan proves is simple: rap doesn’t need a single centre any more. A voice from Kerala can shape the conversation as much as one from London or Atlanta, as long as it has something true to say." },
    ],
  },
  {
    slug: "playboi-carti-at-clout-festival",
    section: "music",
    kicker: "Live",
    title: "Playboi Carti at Clout Festival: a visual dispatch",
    deck: "Stage design, movement and a crowd operating at full intensity.",
    author: "Nia Vale",
    date: "2026-09-22",
    read: "4 min read",
    photo: { src: cartiPhoto, alt: "Playboi Carti performing in a red jacket through stage smoke", crop: { pos: "50% 35%" } },
    body: [
      { type: "p", text: "Some shows are about songs. A Playboi Carti set is about atmosphere. By the time the smoke has settled over the front rows, the crowd has already decided how the night is going to go, and it isn’t gently." },
      { type: "p", text: "The palette is deliberate: red light, heavy haze, black clothing. It’s the visual language Carti has refined since “Whole Lotta Red” and carried through the Opium world he built around it. On stage it reads less like a look and more like weather." },
      { type: "quote", text: "It reads less like a look and more like weather." },
      { type: "h2", text: "A crowd that performs back" },
      { type: "p", text: "What stays with you is the audience. The energy moves in waves from the barrier to the back of the field, and every drop becomes a shared event. Few artists get a crowd to perform back at them this completely." },
      { type: "image", photo: { src: cartiPhoto, alt: "Playboi Carti in red stage light", crop: { pos: "70% 50%" } }, caption: "Red light, heavy haze, black clothing: the palette is deliberate." },
      { type: "p", text: "Carti rarely explains himself, and he doesn’t need to here. The show is the statement: loud, abrasive, carefully designed and, for the people in front of him, completely unforgettable." },
    ],
  },
  {
    slug: "dave-and-the-art-of-the-long-verse",
    section: "music",
    kicker: "Profile",
    title: "Dave and the art of the long verse",
    deck: "In an era of thirty-second clips, the South London rapper keeps proving that patience can be a hook.",
    author: "Jonah Reyes",
    date: "2026-09-20",
    read: "6 min read",
    photo: { src: davePhoto, alt: "Dave performing, eyes closed, holding the microphone close", crop: { pos: "50% 25%" } },
    body: [
      { type: "p", text: "Most rap is now written for the first ten seconds. Dave writes for the whole song. The South London rapper has built one of the most respected catalogues in British music by trusting that listeners will stay with him, and they do." },
      { type: "p", text: "“Psychodrama”, his 2019 debut album, won the Mercury Prize and set the template: dense, personal, structured almost like a therapy session. His performance of “Black” at the 2020 BRIT Awards remains one of the most talked-about moments the ceremony has seen." },
      { type: "quote", text: "He trusts that listeners will stay with him, and they do." },
      { type: "h2", text: "Range without compromise" },
      { type: "p", text: "The same artist who writes seven-minute confessionals also made “Sprinter” with Central Cee, one of the biggest UK rap singles of the decade. The range isn’t a contradiction. It’s the point: craft first, then scale." },
      { type: "image", photo: { src: davePhoto, alt: "Dave on stage in a reflective vest", crop: { pos: "50% 55%" } }, caption: "Dave’s writing asks for patience, and his audience gives it." },
      { type: "p", text: "In a feed built for speed, Dave’s career is a reminder that depth still sells. The long verse isn’t dead. It just needs someone willing to earn every bar." },
    ],
  },
  {
    slug: "congolese-rumbas-second-life",
    section: "culture",
    kicker: "Sound & heritage",
    title: "Congolese rumba’s second life",
    deck: "From Kinshasa and Brazzaville to dance floors everywhere, the music UNESCO recognised as world heritage is finding a new generation.",
    author: "Sana Lind",
    date: "2026-09-19",
    read: "6 min read",
    photo: { src: rogaPhoto, alt: "Roga Roga singing on stage under blue light with his band", crop: { pos: "50% 30%" } },
    body: [
      { type: "p", text: "Long before Afrobeats and amapiano filled global playlists, Congolese rumba was already one of Africa’s great exports. Born on both banks of the Congo River, it carried guitars, horns and harmonies from Kinshasa and Brazzaville to clubs across the continent and beyond." },
      { type: "p", text: "In 2021, UNESCO added Congolese rumba to its list of the Intangible Cultural Heritage of Humanity, a joint recognition for both Congos. It was a formal nod to something audiences had known for decades: this music is a shared inheritance." },
      { type: "quote", text: "This music was never nostalgia. It was always a living conversation." },
      { type: "h2", text: "Why it sounds new again" },
      { type: "p", text: "Producers are sampling the guitar lines, DJs are slipping classic tracks between modern sets, and a younger audience is discovering bandleaders like Roga Roga of Extra Musica through clips before they ever hear a full record." },
      { type: "image", photo: { src: rogaPhoto, alt: "Roga Roga and his band on stage", crop: { pos: "50% 60%" } }, caption: "Roga Roga on stage: the rumba tradition, performed live." },
      { type: "p", text: "Heritage status can freeze a tradition in amber. Rumba is doing the opposite: staying on the dance floor, where it has always done its best work." },
    ],
  },
  {
    slug: "the-listening-bars-changing-nightlife",
    section: "culture",
    kicker: "Nightlife",
    title: "The listening bars changing nightlife",
    deck: "Two hundred people, one sound system and no phones in the air: the rooms that put music back at the centre of the night.",
    author: "Nia Vale",
    date: "2026-09-18",
    read: "6 min read",
    photo: { src: musicHero, alt: "A singer under a single yellow spotlight in a packed club", crop: { pos: "40% 40%" } },
    body: [
      { type: "p", text: "The idea is almost too simple: a small room, a very good sound system and people who came to listen. Listening bars, a format rooted in Japanese jazz kissa culture, are spreading through cities that had forgotten nights could be this focused." },
      { type: "p", text: "The rules are unwritten but understood. Conversations drop to a murmur when a record starts. The selector plays albums, not just singles. Nobody films the whole thing." },
      { type: "quote", text: "Nobody films the whole thing, and that’s exactly why it feels special." },
      { type: "h2", text: "A room, not a venue" },
      { type: "p", text: "What these spaces sell isn’t exclusivity. It’s attention. In a culture where music is mostly background, a room built entirely around listening feels almost radical." },
      { type: "image", photo: { src: musicHero, alt: "The crowd facing the stage in warm light", crop: { pos: "60% 70%" } }, caption: "Small rooms, big sound: the format is spreading city by city." },
      { type: "p", text: "The best ones double as incubators, giving new artists a crowd that actually hears them. That might be their biggest legacy: not the vinyl or the speakers, but the habit of paying attention." },
    ],
  },
  {
    slug: "independent-labels-reclaim-the-runway",
    section: "culture",
    kicker: "Style",
    title: "Independent labels reclaim the runway",
    deck: "A wave of independent labels is skipping the big houses and showing on its own terms, in car parks, basements and under bridges.",
    author: "Sana Lind",
    date: "2026-09-17",
    read: "6 min read",
    photo: { src: styleHero, alt: "A man in a long black coat under a bridge in the rain", crop: { pos: "62% 40%" } },
    body: [
      { type: "p", text: "The official fashion calendar still exists, but it’s no longer the only way in. A generation of independent labels is staging shows wherever the rent is cheapest and the atmosphere is right." },
      { type: "p", text: "The results are rougher and more personal: casting from friends, soundtracks from local producers, collections sold directly to the people in the room. It’s fashion as a scene rather than an industry." },
      { type: "quote", text: "It’s fashion as a scene rather than an industry." },
      { type: "h2", text: "Small runs, loyal audiences" },
      { type: "p", text: "Most of these labels produce in tiny quantities and sell out through communities that feel more like fan clubs than customer bases. Scarcity isn’t a marketing trick here. It’s the reality of making clothes without a backer." },
      { type: "image", photo: { src: styleHero, alt: "Streetlights on wet concrete under a bridge", crop: { pos: "20% 60%" } }, caption: "Shows now happen wherever the atmosphere is right." },
      { type: "p", text: "Whether they grow or stay small, they’re already changing what a fashion week looks like: less spectacle, more signal." },
    ],
  },
  {
    slug: "objects-built-to-outlast-the-feed",
    section: "culture",
    kicker: "Design",
    title: "Objects built to outlast the feed",
    deck: "The designers treating sneakers, headphones and homeware as things to keep, not drops to flip.",
    author: "Jonah Reyes",
    date: "2026-09-16",
    read: "4 min read",
    photo: { src: designHero, alt: "A sneaker and headphones on a concrete plinth", crop: { pos: "50% 55%" } },
    body: [
      { type: "p", text: "Drop culture trained a generation to buy things for the moment they arrive. A growing group of designers is betting on the opposite: objects that are still good in ten years." },
      { type: "p", text: "That means repairable parts, honest materials and forms that don’t depend on a trend. It also means fewer releases, which is a harder sell in a feed that rewards novelty." },
      { type: "quote", text: "The most radical thing a product can do now is last." },
      { type: "h2", text: "Design as a promise" },
      { type: "p", text: "The designers we spoke to talk less about hype and more about responsibility: to the people who buy their work and to the materials it uses." },
      { type: "image", photo: { src: designHero, alt: "Concrete, light and a pair of headphones", crop: { pos: "85% 40%" } }, caption: "Honest materials and forms that don’t chase a trend." },
      { type: "p", text: "It’s slower, and it’s quieter. But in a market drowning in releases, restraint might be the loudest thing left." },
    ],
  },
  {
    slug: "why-brutalism-keeps-returning",
    section: "culture",
    kicker: "Architecture",
    title: "Why brutalism keeps returning",
    deck: "Concrete, once the most hated material in the city, has become a backdrop for a generation’s photographs, shoots and videos.",
    author: "Nia Vale",
    date: "2026-09-15",
    read: "8 min read",
    photo: { src: editorialGrid, alt: "A brutalist concrete building against a grey sky", crop: { pos: "0% 100%", zoom: 2.1 } },
    body: [
      { type: "p", text: "Brutalist buildings were once shorthand for everything that went wrong with post-war cities. Now they’re the backdrop of choice for music videos, lookbooks and late-night photographs." },
      { type: "p", text: "Part of it is visual: raw concrete photographs beautifully, especially at night. Part of it is ideological: these buildings were designed for the public, and that promise still means something." },
      { type: "quote", text: "These buildings were designed for the public, and that promise still means something." },
      { type: "h2", text: "Saving what’s left" },
      { type: "p", text: "Preservation campaigns now draw people who weren’t born when the buildings went up. For them, brutalism isn’t nostalgia. It’s evidence that cities once thought bigger." },
      { type: "p", text: "Whether the next generation of architecture learns from that ambition, or just borrows the aesthetic, is the real question." },
    ],
  },
  {
    slug: "a-new-generation-remakes-print",
    section: "culture",
    kicker: "Print",
    title: "A new generation remakes print",
    deck: "Zines, small-run magazines and risograph posters are selling out again, and not only to collectors.",
    author: "Sana Lind",
    date: "2026-09-14",
    read: "5 min read",
    photo: { src: editorialGrid, alt: "Two people working over pages in a print studio", crop: { pos: "100% 100%", zoom: 2.1 } },
    body: [
      { type: "p", text: "Print was supposed to be finished. Instead, small-run magazines and zines are selling out, and their makers are some of the most connected people online." },
      { type: "p", text: "The appeal is permanence. A printed page can’t be edited after the fact or buried by an algorithm. It sits on a shelf and waits." },
      { type: "quote", text: "A printed page can’t be buried by an algorithm." },
      { type: "h2", text: "Made by hand, found by word of mouth" },
      { type: "p", text: "Many of the new titles are made in shared studios, printed in runs of a few hundred and sold through the same communities they document." },
      { type: "p", text: "It’s not a nostalgia trip. It’s a way of making something that lasts longer than a scroll." },
    ],
  },
];

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);
export const articlesIn = (section: SectionId) => ARTICLES.filter((a) => a.section === section);
export const article = (slug: string) => getArticle(slug)!;

// Curated orders used across the site
export const LEAD = article("central-cee-and-the-global-rise-of-uk-rap");
export const LISTS = {
  latest: ARTICLES.slice(0, 5),
  trending: ["vedan-and-the-reach-of-regional-rap", "central-cee-and-the-global-rise-of-uk-rap", "playboi-carti-at-clout-festival", "a-new-generation-remakes-print", "independent-labels-reclaim-the-runway"].map(article),
  mostRead: ["the-listening-bars-changing-nightlife", "central-cee-and-the-global-rise-of-uk-rap", "dave-and-the-art-of-the-long-verse", "objects-built-to-outlast-the-feed", "vedan-and-the-reach-of-regional-rap"].map(article),
  editorsPicks: ["why-brutalism-keeps-returning", "congolese-rumbas-second-life", "a-new-generation-remakes-print", "independent-labels-reclaim-the-runway", "dave-and-the-art-of-the-long-verse"].map(article),
  featured: ["independent-labels-reclaim-the-runway", "central-cee-and-the-global-rise-of-uk-rap", "congolese-rumbas-second-life", "objects-built-to-outlast-the-feed", "the-listening-bars-changing-nightlife"].map(article),
};

export const READING_LISTS = [
  { id: "uk-rap", title: "UK rap, explained", note: "Three stories on how British rap went global.", items: ["central-cee-and-the-global-rise-of-uk-rap", "dave-and-the-art-of-the-long-verse", "the-listening-bars-changing-nightlife"].map(article) },
  { id: "built-to-last", title: "Built to last", note: "Design, buildings and pages made to outlive the feed.", items: ["objects-built-to-outlast-the-feed", "why-brutalism-keeps-returning", "a-new-generation-remakes-print"].map(article) },
  { id: "after-dark", title: "After dark", note: "Live shows, loud rooms and the music that carries a night.", items: ["playboi-carti-at-clout-festival", "the-listening-bars-changing-nightlife", "congolese-rumbas-second-life"].map(article) },
];

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
    still: { src: musicHero, alt: "A singer under a single spotlight in a packed listening bar", crop: { pos: "40% 40%" } },
    title: "Inside the listening bar: one night, one record",
    summary: "We spend a night in a listening bar and ask the selector why one record can hold a room.",
    body: [
      "One room, one sound system and one rule: listen. OGCW Sessions spends a night behind the counter of a listening bar, from the first record at opening to the last track before the lights come up.",
      "The selector talks us through how a night is built, why albums beat playlists and what happens to a crowd when nobody reaches for their phone.",
    ],
    chapters: [["00:00", "Opening the room"], ["02:15", "Choosing the first record"], ["06:40", "The crowd goes quiet"], ["10:05", "Last track"]],
    credits: [["Series", "OGCW Sessions"], ["Produced by", "OGCW"], ["Format", "Interview"]],
    related: ["the-listening-bars-changing-nightlife"],
  },
  {
    slug: "made-to-last-object-makers",
    series: "Made to Last", number: 1, kind: "Reportage", length: "08:15", date: "2026-09-23",
    still: { src: designHero, alt: "A sneaker and headphones on a concrete plinth", crop: { pos: "50% 55%" } },
    title: "Made to last: in the studio with the object makers",
    summary: "In the studio with designers building sneakers, headphones and homeware to keep, not to flip.",
    body: [
      "Made to Last visits the studios of designers who build objects meant to outlive the feed, from repairable headphones to shoes resoled rather than replaced.",
      "We follow a single piece from sketch to finished object and ask what it takes to design for ten years instead of ten days.",
    ],
    chapters: [["00:00", "The studio"], ["01:50", "Materials first"], ["04:30", "Repair, not replace"], ["07:10", "What lasting means"]],
    credits: [["Series", "Made to Last"], ["Produced by", "OGCW"], ["Format", "Reportage"]],
    related: ["objects-built-to-outlast-the-feed"],
  },
  {
    slug: "the-list-records-that-shaped-the-year",
    series: "The List", number: 1, kind: "The list", length: "05:32", date: "2026-09-20",
    still: { src: editorialGrid, alt: "A DJ at the decks, record shelves behind her", crop: { pos: "0% 0%", zoom: 2.1 } },
    title: "Ten records that shaped the year so far",
    summary: "The OGCW music desk counts down the records everyone kept coming back to.",
    body: [
      "The List is OGCW’s fast countdown format. In this first episode the music desk argues its way through the records that defined the year so far, across rap, rumba and everything between.",
      "Expect disagreements, a few surprises and at least one record you’ll want to go back to.",
    ],
    chapters: [["00:00", "The rules"], ["00:45", "10 to 6"], ["02:40", "5 to 2"], ["04:30", "Number one"]],
    credits: [["Series", "The List"], ["Produced by", "OGCW music desk"], ["Format", "Countdown"]],
    related: ["central-cee-and-the-global-rise-of-uk-rap", "dave-and-the-art-of-the-long-verse"],
  },
  {
    slug: "street-level-independent-labels",
    series: "Street Level", number: 1, kind: "Reportage", length: "10:05", date: "2026-09-18",
    still: { src: styleHero, alt: "A man in a long black coat under a bridge in the rain", crop: { pos: "62% 40%" } },
    title: "Independent labels, off the runway",
    summary: "Backstage at a show staged under a bridge, with the labels skipping fashion week altogether.",
    body: [
      "Street Level follows the independent labels putting on shows in car parks, basements and under bridges, with friends as models and local producers on the soundtrack.",
      "We go backstage before, during and after a show to see how a collection comes together without a fashion house behind it.",
    ],
    chapters: [["00:00", "Finding the location"], ["03:10", "Casting from friends"], ["06:00", "Showtime"], ["08:45", "Sold in the room"]],
    credits: [["Series", "Street Level"], ["Produced by", "OGCW"], ["Format", "Reportage"]],
    related: ["independent-labels-reclaim-the-runway"],
  },
  {
    slug: "city-notes-where-brutalism-lives",
    series: "City Notes", number: 1, kind: "Analysis", length: "07:48", date: "2026-09-15",
    still: { src: editorialGrid, alt: "A brutalist concrete building against a grey sky", crop: { pos: "0% 100%", zoom: 2.1 } },
    title: "Where brutalism lives now",
    summary: "A walk through the concrete buildings a new generation wants to save.",
    body: [
      "City Notes is a walking series about how cities shape culture. This episode tours the brutalist buildings that became the backdrop for a generation’s photographs and videos.",
      "Along the way: why concrete photographs so well at night, and what these buildings still promise the public.",
    ],
    chapters: [["00:00", "Concrete at night"], ["02:20", "Built for the public"], ["05:05", "Saving what’s left"]],
    credits: [["Series", "City Notes"], ["Produced by", "OGCW"], ["Format", "Analysis"]],
    related: ["why-brutalism-keeps-returning"],
  },
  {
    slug: "print-run-the-zine-makers",
    series: "Print Run", number: 1, kind: "Short doc", length: "09:20", date: "2026-09-12",
    still: { src: editorialGrid, alt: "Two people working over pages in a print studio", crop: { pos: "100% 100%", zoom: 2.1 } },
    title: "The zine makers",
    summary: "In a shared studio with the people printing small-run magazines that sell out in days.",
    body: [
      "Print Run spends a week in a shared studio where small-run magazines and zines are made, printed and packed by hand.",
      "We follow one issue from layout to launch night, and ask why a printed page still matters to people who grew up online.",
    ],
    chapters: [["00:00", "The studio"], ["02:40", "Layout"], ["05:15", "On the press"], ["08:00", "Launch night"]],
    credits: [["Series", "Print Run"], ["Produced by", "OGCW"], ["Format", "Short documentary"]],
    related: ["a-new-generation-remakes-print"],
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
