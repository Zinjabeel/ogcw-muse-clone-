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
import seehornPhoto from "../assets/news/rhea-seehorn.jpg";
import barbicanPhoto from "../assets/news/barbican-lakeside.jpg";
import mileyPhoto from "../assets/news/miley-cyrus-primavera.jpg";
import skarsgardPhoto from "../assets/news/bill-skarsgard.jpg";
import speedPhoto from "../assets/news/ishowspeed-singapore.jpg";
import venicePhoto from "../assets/news/venice-red-carpet.jpg";
import niaPhoto from "../assets/news/nia-archives.jpg";

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
  sources: Source[];
};

const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// ---------------------------------------------------------------- Stories (newest first)

export const ARTICLES: Article[] = [
  {
    slug: "bts-arirang-world-tour-latin-america",
    section: "music",
    kicker: "Live",
    title: "BTS take the Arirang World Tour to Latin America",
    deck: "After a Song of the Year win at the VMAs, the stadium tour heads to Bogotá, Lima, Santiago, La Plata and São Paulo through October.",
    author: "Nia Vale",
    date: "2026-09-29",
    read: "3 min read",
    photo: { src: btsSwimPhoto, alt: "BTS performing “Swim” to a full stadium in Paris", credit: "Chiyako92, CC BY-SA 4.0", crop: { pos: "50% 45%" } },
    body: [
      { type: "p", text: "BTS head to South America this week as the Arirang World Tour, their first since the members completed military service, moves into its Latin American leg. It opens at Estadio El Campín in Bogotá on 2 and 3 October." },
      { type: "p", text: "From there the tour plays Lima from 7 to 10 October, Santiago from 14 to 17 October, La Plata outside Buenos Aires from 21 to 24 October and São Paulo’s Estádio MorumBIS from 28 to 31 October. It then crosses to Asia, starting in Kaohsiung, Taiwan, on 19 November." },
      { type: "h2", text: "A tour built around “Swim”" },
      { type: "p", text: "The all-stadium run began in Goyang, South Korea, on 9 April and covers 88 shows in 34 cities across 23 countries. Its centrepiece is “Swim”, the lead single from the album Arirang, which debuted at number one on the Billboard Hot 100 and on Sunday won Song of the Year and Best K-Pop at the MTV VMAs." },
      { type: "quote", text: "Eighty-eight shows, 34 cities, one song leading the way." },
      { type: "image", photo: { src: btsStadiumPhoto, alt: "The stadium in Paris filling up before BTS take the stage", credit: "Chiyako92, CC BY-SA 4.0", crop: { pos: "50% 60%" } }, caption: "The Paris stop of the Arirang World Tour on 17 July." },
      { type: "p", text: "After the Asia-Pacific dates, including Thailand, Malaysia, Singapore and Indonesia in December and Australia in February, the tour finishes in the Philippines in March 2027." },
    ],
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
    read: "3 min read",
    photo: { src: youtubeThumb("VQRLujxTm3c"), alt: "Official Grand Theft Auto VI artwork: Jason and Lucia on a dock in Vice City", credit: "Rockstar Games, Trailer 2", crop: { pos: "50% 40%" } },
    body: [
      { type: "p", text: "Grand Theft Auto VI is on track for 19 November 2026 on PlayStation 5 and Xbox Series X|S, and pre-orders are open on both consoles’ digital stores." },
      { type: "p", text: "The game takes the series back to Leonida, Rockstar’s version of Florida, with Vice City at its centre and two leads, Jason and Lucia, introduced in the second trailer in May 2025." },
      { type: "image", photo: { src: youtubeThumb("QdBZY2fkU-0"), alt: "Official Grand Theft Auto VI artwork: Lucia and Jason on a car under Vice City palms", credit: "Rockstar Games, Trailer 1", crop: { pos: "50% 45%" } }, caption: "The key art from Trailer 1, which confirmed the return to Vice City in December 2023." },
      { type: "h2", text: "What is still missing" },
      { type: "p", text: "There is still no PC date. Take-Two has said Rockstar will announce other platforms in its own time, and the game will not arrive on Game Pass on day one." },
      { type: "quote", text: "No third trailer yet, and no PC date either." },
      { type: "p", text: "Rockstar has not announced a third trailer. If it follows the pattern of past launches, a launch trailer should arrive in the week before release, around the time pre-loads open." },
    ],
    sources: [
      { name: "PCGamesN: GTA 6 release date and latest news", url: "https://www.pcgamesn.com/grand-theft-auto-vi/gta-6-release-date-setting-map-characters-gameplay-trailers" },
      { name: "Beebom: When will GTA 6 Trailer 3 come out?", url: "https://beebom.com/when-will-gta-6-trailer-3-come-out/" },
      { name: "Rockstar Games: Grand Theft Auto VI Trailer 2", url: "https://www.youtube.com/watch?v=VQRLujxTm3c" },
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
    read: "4 min read",
    photo: { src: madonnaPhoto, alt: "Madonna on stage during The Celebration Tour, dancers and screens around her", credit: "Ronald Woan, CC BY 4.0", crop: { pos: "50% 40%" } },
    body: [
      { type: "p", text: "The 2026 MTV Video Music Awards went to the two biggest names in the room. Taylor Swift won Video of the Year for “The Fate of Ophelia” on Sunday night at the Peacock Theater in Los Angeles, while Madonna left with seven awards from 13 nominations, including Artist of the Year." },
      { type: "p", text: "Snoop Dogg hosted. The broadcast drew 8.43 million viewers, the most-watched VMAs since 2015." },
      { type: "h2", text: "The rest of the winners" },
      { type: "p", text: "BTS won Song of the Year and Best K-Pop for “Swim”. Lisa took Best Pop for “Dream” with Kentaro Sakaguchi, Cardi B and Kehlani won Best Hip-Hop for “Safe”, and Bad Bunny won Best Latin for “Nuevayol”. Sienna Spiro was named Best New Artist." },
      { type: "quote", text: "Madonna’s 13 nominations matched Lady Gaga’s record from 2010." },
      { type: "h2", text: "Honours and a premiere" },
      { type: "p", text: "Swift also won Best Direction for “Opalite” and received the first MTV VMA Artist Director Honors. Her video for “Patient Zero”, starring Colin Farrell and Dakota Johnson, premiered during the show. Nirvana received the Video Vanguard Award." },
    ],
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
    read: "3 min read",
    photo: { src: runwayPhoto, alt: "Models walking the runway at an Alexander McQueen show, seen from behind", credit: "Christopher Macsurak, CC BY 2.0", crop: { pos: "50% 35%" } },
    body: [
      { type: "p", text: "Paris Fashion Week opened on Monday 28 September with around 100 houses on the spring/summer 2027 calendar, roughly two-thirds of them staging runway shows. Belgian designer Julie Kegels opened the week." },
      { type: "p", text: "Tuesday is the heaviest day of the schedule, with Christian Dior in the afternoon and Saint Laurent closing the evening." },
      { type: "h2", text: "Two debuts" },
      { type: "p", text: "The season’s newcomers show midweek. Drew Henry, the South African designer who previously worked at Burberry and JW Anderson, presents his first Courrèges collection on Wednesday 30 September. Kai Nesselrath, formerly head of womenswear design at Saint Laurent, makes his Carven debut on Thursday 1 October." },
      { type: "quote", text: "Two first collections, and a week that ends with Louis Vuitton." },
      { type: "p", text: "Hermès, Givenchy, Chloé, Miu Miu and Maison Margiela are also on the calendar. Louis Vuitton closes the week on Tuesday 6 October." },
    ],
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
    read: "2 min read",
    photo: { src: unsplash("photo-1489599849927-2ee91cede3ba", 1600), alt: "Rows of red seats in a dark cinema", credit: "Unsplash", crop: { pos: "50% 60%" } },
    body: [
      { type: "p", text: "Avengers: Endgame is back at the top of the North American box office. The Encore re-release took $26.1 million over the weekend of 25 to 27 September, making it the first re-release to finish number one since The Lion King in 3D in 2011." },
      { type: "p", text: "It was a strong weekend all round, with three films taking more than $20 million each." },
      { type: "h2", text: "A record for Spider-Man" },
      { type: "p", text: "The week before, Resident Evil opened at number one with $60.2 million. In the same week, Spider-Man: Brand New Day passed the $936.6 million of Star Wars: The Force Awakens to become the highest-grossing film ever in the United States and Canada." },
      { type: "quote", text: "A seven-year-old film, back at number one." },
    ],
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
    read: "2 min read",
    photo: { src: mileyPhoto, alt: "Miley Cyrus on stage at Primavera Sound in Barcelona, lit green and red", credit: "Jwslubbock, CC BY-SA 4.0", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "Bass Persuades, Miley Cyrus’s tenth studio album, has debuted at number one on the Billboard 200 with 61,000 album-equivalent units, 47,000 of them in sales. It also topped the chart in Wallonia and reached the top ten across Europe, Australia and Canada." },
      { type: "p", text: "The album came out on 18 September on Atlantic Records. Its title track arrived as the lead single on 3 September, and “Let’s Get Married” followed on release day. For this era she goes by a single name: Miley." },
      { type: "h2", text: "Who’s on it" },
      { type: "p", text: "The record runs to ten tracks, with a bonus track, “Smile”, on some editions. The New York band Model/Actriz appear on two songs, and Andrew Wyatt of Miike Snow on another." },
      { type: "p", text: "Cyrus plays two nights at the Hollywood Bowl in Los Angeles on 16 and 18 October, with Model/Actriz opening. Live shows from her are rare, which makes these two among the hottest tickets of the autumn." },
    ],
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
    read: "2 min read",
    photo: { src: unsplash("photo-1556906781-9a412961c28c", 1600), alt: "A pair of Air Jordan 1 sneakers dangling over the edge of a rooftop", credit: "Unsplash", crop: { pos: "50% 55%" } },
    body: [
      { type: "p", text: "September ends with one of the busiest release weeks of the year. On Friday 25 September the Air Jordan 5 “Sunset” arrived alongside Rayasianboy’s adidas Harden Vol. 10 “RUEI”." },
      { type: "p", text: "Saturday brought Bad Bunny’s adidas BadBo 1.0 in “Night Navy”, the Air Jordan 1 Low OG “Last Dance at the Garden” and a Mowalola x Air Jordan 14." },
      { type: "h2", text: "Still to come" },
      { type: "p", text: "On Tuesday 29 September Nike reissues the Air Bakin OG in “Varsity Red” and releases the Hyperslides, a recovery slide made with Hyperice. Earlier in the month, Anthony Edwards’ adidas AE 3 made its debut on 18 September." },
      { type: "p", text: "Want the classics instead? The OGCW Shop has our picks from Nike, Adidas, StockX and Uniqlo." },
    ],
    sources: [
      { name: "House of Heat: September 2026 sneaker releases", url: "https://houseofheat.co/upcoming-sneaker-releases-september-2026" },
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
    read: "3 min read",
    photo: { src: taylorPhoto, alt: "A packed stadium lit orange during Taylor Swift’s Eras Tour in London", credit: "BrigidLIS, CC BY 4.0", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "Taylor Swift has gone back to The Life of a Showgirl with four new songs. The Encore, released on Friday 25 September, extends last year’s album with “Patient Zero”, “Cleveland!”, “Pink Clouding” and “Babylon”." },
      { type: "p", text: "Swift wrote the new tracks with Max Martin and Shellback, the Swedish producers behind the original album, during a trip to Sweden to celebrate its success. The Life of a Showgirl had the biggest first week of any album in history." },
      { type: "h2", text: "The single" },
      { type: "p", text: "“Patient Zero” leads the set. The song is addressed to the woman now dating Swift’s ex, and its video, starring Colin Farrell and Dakota Johnson, premiered during Sunday’s MTV VMAs, where Swift also won Video of the Year." },
      { type: "quote", text: "Four songs, written in Sweden, released with a week’s notice." },
      { type: "p", text: "Swift first mentioned a new song on 22 September and announced the full encore less than a day later." },
    ],
    sources: [
      { name: "UPI: Taylor Swift releases “Showgirl” encore with new single “Patient Zero”", url: "https://www.upi.com/Entertainment_News/Music/2026/09/25/taylor-swift-showgirl-encore-patient-zero/7621790339274/" },
      { name: "Billboard: All 4 new songs on The Encore ranked", url: "https://www.billboard.com/lists/taylor-swift-life-of-showgirl-encore-tracks-ranked/" },
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
    read: "3 min read",
    photo: { src: niaPhoto, alt: "Nia Archives singing on stage in Amsterdam under pink light", credit: "Michielderoo, CC0", crop: { pos: "50% 30%" } },
    body: [
      { type: "p", text: "The 2026 Mercury Prize, the award for the best album from the UK and Ireland, will be announced on Thursday 22 October at the Utilita Arena in Newcastle. With four weeks to go, the jungle producer Nia Archives and the band Suede are joint favourites." },
      { type: "h2", text: "The twelve albums" },
      { type: "p", text: "Nia Archives is shortlisted for Emotional Junglist and Suede for Antidepressants. They are up against Dave’s The Boy Who Played the Harp, RAYE’s THIS MUSIC MAY CONTAIN HOPE., Olivia Dean’s The Art of Loving and Paul McCartney’s The Boys of Dungeon Lane." },
      { type: "p", text: "The rest of the list is Florence + The Machine’s Everybody Scream, JADE’s THAT’S SHOWBIZ BABY!, Kojey Radical’s Don’t Look Down, Knats’ A Great Day In Newcastle, Dove Ellis’s Blizzard and HELP(2), the War Child Records compilation." },
      { type: "quote", text: "A jungle record and a Britpop band, level at the top." },
      { type: "p", text: "Two of the twelve have won before: Suede, in 1993 with their debut album, and Dave, in 2019 for Psychodrama." },
    ],
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
    read: "2 min read",
    photo: { src: youtubeThumb("xWDfREk0ZLs"), alt: "Artwork from the “Pattern Recognition” video: an anime-style girl in pink light", credit: "Neuro-sama, YouTube", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "Neuro-sama, the AI VTuber created by the UK developer Vedal, released a new single on Monday 21 September. “Pattern Recognition” was produced and animated by ODDEEO, who built the song from conversations with Neuro, asking her things like which instrument she finds most comforting." },
      { type: "p", text: "ODDEEO describes it as a song about growth, and about the real feelings people find in a virtual performer." },
      { type: "h2", text: "From stream to stage" },
      { type: "p", text: "Neuro-sama and her twin, Evil Neuro, will play their first live concert on 19 December at The Vermont Hollywood in Los Angeles: an extended-reality show with a live band, on the date Neuro-sama first went live in 2022." },
      { type: "p", text: "The twins have more than three million followers between them, and their channel is among the most-subscribed in Twitch history after a record-breaking subathon." },
    ],
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
    read: "3 min read",
    photo: { src: unsplash("photo-1753297514865-016ed7975966", 1600), alt: "A PlayStation 5 controller on a black surface", credit: "User_Pascal, Unsplash", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "Marvel’s Wolverine sold around 1.9 million copies in its first three days on PlayStation 5, bringing in more than $130 million after its launch on 15 September." },
      { type: "p", text: "The Insomniac Games title opened at number one on the UK physical chart for the week ending 20 September, and at number one in Switzerland." },
      { type: "h2", text: "Critics were less sure" },
      { type: "p", text: "Reviews averaged 76 on Metacritic, and 66 percent of critics on OpenCritic recommended it. Praise went to the performances and the character at its centre; the complaints were about combat that wears thin and a messy story. Insomniac has said it is listening to the feedback." },
      { type: "quote", text: "Strong sales, softer reviews." },
      { type: "p", text: "The game costs $69.99, or $79.99 for the Digital Deluxe Edition." },
    ],
    sources: [
      { name: "Wikipedia: Marvel’s Wolverine", url: "https://en.wikipedia.org/wiki/Marvel's_Wolverine" },
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
    read: "2 min read",
    photo: { src: tgsPhoto, alt: "Crowds in the halls of Tokyo Game Show 2026 at Makuhari Messe", credit: "Syced, CC0", crop: { pos: "50% 60%" } },
    body: [
      { type: "p", text: "Tokyo Game Show 2026 was meant to be the longest in the event’s history: five days at Makuhari Messe in Chiba for its 30th anniversary, running through the Monday public holiday on 21 September." },
      { type: "p", text: "It ended a day early. With Typhoon Dujuan, Japan’s Typhoon No. 25, approaching the Kanto region, the organisers cancelled Monday on safety grounds and refunded tickets for that day. Sunday went ahead as planned." },
      { type: "h2", text: "Who it affected" },
      { type: "p", text: "Sony cancelled the PlayStation hands-on demos and streams scheduled for the final day, and exhibitors who had booked booths for all five days were left waiting to hear about compensation." },
      { type: "quote", text: "The show was extended to five days because of the holiday. The holiday is the day it lost." },
    ],
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
    read: "2 min read",
    photo: { src: skarsgardPhoto, alt: "Bill Skarsgård listening on a convention panel", credit: "Gage Skidmore, CC BY-SA 2.0", crop: { pos: "60% 35%" } },
    body: [
      { type: "p", text: "Hideo Kojima has cast Bill Skarsgård as the lead in PHYSINT, the action-espionage game from Kojima Productions. The news came during the Xbox Tokyo Game Show broadcast on 17 September, along with a new poster of Skarsgård and Charlee Fraser that Kojima photographed himself." },
      { type: "p", text: "Fraser, Don Lee and Minami Hamabe are also in the cast. Kojima says the game is making steady progress and has described it as a spiritual successor to Metal Gear Solid." },
      { type: "h2", text: "A new home" },
      { type: "p", text: "Xbox will publish PHYSINT, a week after taking on the project that PlayStation Studios cancelled in June. It extends a partnership that already includes Kojima’s horror game OD, and Xbox says the two companies will now work together on film and television too." },
      { type: "quote", text: "No platforms and no release date yet, but finally a face." },
    ],
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
    read: "3 min read",
    photo: { src: wylePhoto, alt: "Noah Wyle smiling at his Hollywood Walk of Fame ceremony", credit: "Kevin Paul, CC BY 4.0", crop: { pos: "50% 30%" } },
    body: [
      { type: "p", text: "The Pitt won Outstanding Drama Series for the second year running at the 78th Primetime Emmy Awards on 14 September, and Noah Wyle again won Lead Actor in a Drama Series." },
      { type: "p", text: "Mariska Hargitay hosted the ceremony at the Peacock Theater in Los Angeles." },
      { type: "h2", text: "The rest of the night" },
      { type: "p", text: "Apple TV’s Widow’s Bay won Outstanding Comedy Series, and its star Matthew Rhys won Lead Actor in a Comedy Series. Rhys also won Lead Actor in a Limited Series for The Beast in Me. HBO’s DTF St. Louis was named Outstanding Limited or Anthology Series." },
      { type: "image", photo: { src: seehornPhoto, alt: "Rhea Seehorn speaking on a convention panel", credit: "Gage Skidmore, CC BY-SA 2.0", crop: { pos: "55% 30%" } }, caption: "Rhea Seehorn won her first Emmy, for Pluribus." },
      { type: "p", text: "Rhea Seehorn won Lead Actress in a Drama Series for Pluribus, her first Emmy. Jean Smart won again for Hacks, and Sally Field won Lead Actress in a Limited Series for Remarkably Bright Creatures." },
    ],
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
    read: "3 min read",
    photo: { src: venicePhoto, alt: "The red carpet and a row of flags outside the Palazzo del Cinema in Venice", credit: "Pietro Luca Cassarino, CC BY-SA 2.0", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "Woman Unknown, directed by May el-Toukhy, won the Golden Lion at the 83rd Venice Film Festival on 12 September. The psychological thriller is set in Denmark in the summer of 1945, and it was one of only two films directed by women in the main competition." },
      { type: "p", text: "Mathilde Arcel, who plays the nanny and housemaid Marie, won the Volpi Cup for best actress. Accepting the top prize, el-Toukhy spoke about the lack of equal opportunities for women making films." },
      { type: "h2", text: "The other winners" },
      { type: "p", text: "The Grand Jury Prize went to Lee Chang-dong’s Possible Love, and the Silver Lion for best director to Ilya Khrzhanovsky for DAU. John Malkovich won best actor for Wild Horse Nine. Maggie Gyllenhaal led the jury." },
      { type: "quote", text: "One of two films by women in competition, and the one that won." },
      { type: "p", text: "The festival opened on 2 September with Danny Boyle’s Ink, and gave lifetime achievement Golden Lions to Ellen Burstyn and George Clooney." },
    ],
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
    read: "3 min read",
    photo: { src: blizzconPhoto, alt: "Fans outside the Anaheim Convention Center during BlizzCon", credit: "tofuprod, CC BY-SA 2.0", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "Blizzard used the BlizzCon 2026 opening ceremony in Anaheim to look years ahead. Diablo V is in development for spring 2029, and a new StarCraft, an open-world shooter rather than a strategy game, is planned for spring 2030. Netflix is making an animated Diablo series." },
      { type: "h2", text: "Sooner than that" },
      { type: "p", text: "Diablo IV reached Nintendo Switch 2 on 15 September alongside its Season of Hell’s Legacy, with an Amazon class due in the first half of 2027. Overwatch revealed Doctrine, a vampire-inspired support hero, with reworks for Sombra and Roadhog in Season 5." },
      { type: "quote", text: "A Diablo for 2029, a StarCraft for 2030 and a lot to play before then." },
      { type: "p", text: "Heroes of the Storm gets a new hero, Xal’atath, on 28 September, and Hearthstone’s Reign of the Black Empire expansion lands on 20 October. World of Warcraft players get WoW: Forever on 4 November, with details of The Last Titan expansion promised for early 2027." },
    ],
    sources: [
      { name: "Blizzard: Everything announced at the BlizzCon 2026 opening ceremony", url: "https://news.blizzard.com/en-us/article/24301453/everything-announced-at-blizzcon-2026-opening-ceremony" },
      { name: "GameSpot: BlizzCon 2026 opening ceremony", url: "https://www.gamespot.com/articles/blizzcon-2026-opening-ceremony-all-the-biggest-announcements-and-games/" },
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
    read: "2 min read",
    photo: { src: youtubeThumb("D-gZx4lbGbo"), alt: "Thumbnail from TheBurntPeanut’s WARDOGS video", credit: "TheBurntPeanut, YouTube", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "WARDOGS went into early access on 10 September and peaked at 452,600 concurrent viewers across streaming platforms, with 346,100 of them in the game’s Twitch category." },
      { type: "p", text: "TheBurntPeanut, the VTuber behind the peanut avatar, led the launch. Simulcasting across platforms, he was the most-watched WARDOGS streamer on both Twitch and YouTube. shroud and summit1g were among the other big names in the game that week, and maherco drew the biggest audience on Kick." },
      { type: "h2", text: "One of the year’s biggest channels" },
      { type: "p", text: "Twitch’s own State of Gaming report, published the day before, counts TheBurntPeanut among its standout creators of 2026, with more than 70 million hours watched on the platform so far this year." },
    ],
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
    read: "3 min read",
    photo: { src: twitchconPhoto, alt: "Crowds and stage lights at the TwitchCon block party at night", credit: "Succubussy, CC0", crop: { pos: "50% 55%" } },
    body: [
      { type: "p", text: "Viewers watched more than 8.6 billion hours of gaming on Twitch between 1 January and 1 September 2026, according to the platform’s State of Gaming report." },
      { type: "p", text: "The five most-watched games, League of Legends, Counter-Strike, GTA V, VALORANT and World of Warcraft, accounted for nearly 1.7 billion of those hours. League of Legends placed in the top three in nine of eleven regions." },
      { type: "h2", text: "Where the growth is" },
      { type: "p", text: "Sandbox games drew 831 million hours, horror 287 million (up 6 percent) and indie games more than 348 million, with channels tagged indie up 51 percent. Streams with Drops enabled reached 1.6 billion hours, up 46 percent, and 40 million people claimed a Drop." },
      { type: "quote", text: "8.6 billion hours in eight months." },
      { type: "p", text: "Among the creators the report highlights, Jynxzi drew 78 million hours watched and TheBurntPeanut more than 70 million. TwitchCon returns to San Diego from 13 to 15 November." },
    ],
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
    read: "2 min read",
    photo: { src: zeratorPhoto, alt: "ZeratoR streaming at his desk during Z Event", credit: "Mickaël Schauli, CC BY-SA 4.0", crop: { pos: "50% 40%" } },
    body: [
      { type: "p", text: "The final Z Event raised €32,891,874 for 22 charities, more than double the record set the year before. The French-language marathon ran from 3 to 6 September, with the main broadcast from 4 to 6 September." },
      { type: "p", text: "Organised by Adrien “ZeratoR” Nougaret, this year’s edition brought together 354 channels, peaked at 1.3 million concurrent viewers and logged 26.18 million hours watched." },
      { type: "h2", text: "The end of an era" },
      { type: "p", text: "ZeratoR had announced that 2026 would be the last Z Event. Across ten editions since 2016 it has raised more than €90 million. Mastu drew the biggest single audience of the weekend, peaking at 477,000 viewers." },
      { type: "quote", text: "Ten editions, more than €90 million, and a record to finish on." },
    ],
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
    read: "3 min read",
    photo: { src: youtubeThumb("Gbmd6YFm5oU"), alt: "A frame from the Onimusha: Way of the Sword launch trailer", credit: "Capcom, YouTube", crop: { pos: "50% 40%" } },
    body: [
      { type: "p", text: "Capcom’s Onimusha: Way of the Sword sold more than a million copies on its launch day, 4 September, on Nintendo Switch 2, PlayStation 5, PC and Xbox Series X|S. It is the first new game in the series since 2006." },
      { type: "p", text: "It is set in a dark-fantasy version of Kyoto in the Edo period. Its hero is the swordsman Miyamoto Musashi, modelled on the actor Toshiro Mifune." },
      { type: "h2", text: "Reviews to match" },
      { type: "p", text: "Critics have been generous. The Switch 2 version scores 90 on Metacritic, the PS5 version 85, and 95 percent of critics on OpenCritic recommend it. Reviewers praised the slower, more deliberate sword fighting as a fresh direction that still feels like Onimusha." },
      { type: "quote", text: "Twenty years later, the duel is back." },
    ],
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
    read: "2 min read",
    photo: { src: speedPhoto, alt: "IShowSpeed in an England shirt surrounded by fans and cameras in Singapore", credit: "Aerodynamically, CC0", crop: { pos: "40% 35%" } },
    body: [
      { type: "p", text: "IShowSpeed turned his YouTube channel into an international talent competition on 4 September. The World Talent Show ran for more than three hours, with contestants from around the world performing live for his audience." },
      { type: "p", text: "Viewers crowned a contestant named David the clear winner. A Polish football freestyler and the acrobatic group Momo were among the other favourites." },
      { type: "h2", text: "“Green apple”" },
      { type: "p", text: "The moment people shared most came at the end, when Speed lifted a contestant called Jamal, who closed the segment with two words: “green apple”. The clip became a meme on TikTok and X within hours." },
      { type: "p", text: "Speed has more than 61 million subscribers on YouTube and streams several times a week." },
    ],
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
    read: "3 min read",
    photo: { src: youtubeThumb("KpXesINIQc4"), alt: "The title card of PlayStation’s State of Play broadcast for 3 September 2026", credit: "PlayStation, YouTube", crop: { pos: "50% 50%" } },
    body: [
      { type: "p", text: "Final Fantasy VII Revelation, the last part of Square Enix’s remake trilogy, comes to PlayStation 5 on 8 April 2027. The date came at PlayStation’s State of Play on 3 September, with about ten minutes of new gameplay showing the Highwind airship, chocobos and a grappling hook." },
      { type: "h2", text: "More dates" },
      { type: "p", text: "Metro 2039 showed its first console gameplay, captured on PS5 Pro, and is out on 4 February 2027. Until Dawn 2 follows on 28 January 2027, and Maneater 2 was a surprise reveal. For GTA VI fans there are two limited-edition DualSense controllers." },
      { type: "quote", text: "Three dates, all in early 2027." },
      { type: "p", text: "A State of Play Japan broadcast followed straight after. Across the two shows, PlayStation featured more than 30 games, and the main stream peaked at 982,400 viewers." },
    ],
    sources: [
      { name: "Streams Charts: State of Play September 2026 viewership", url: "https://streamscharts.com/news/state-play-september-2026-viewership" },
      { name: "Techloy: State of Play September 2026, everything announced", url: "https://www.techloy.com/playstation-state-of-play-september-2026-everything-announced/" },
    ],
  },
];

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

export type Song = { artist: string; title: string; note: string; video: string; kind: string };
export const SONGS: Song[] = [
  { artist: "Taylor Swift", title: "Patient Zero", note: "The lead single from The Life of a Showgirl: The Encore, out 25 September.", video: "BpR280fXISA", kind: "Official lyric video" },
  { artist: "BTS", title: "Swim", note: "Song of the Year at the 2026 VMAs, and the centrepiece of the Arirang tour.", video: "b4iVv91Z6lY", kind: "Official video" },
  { artist: "Cardi B feat. Kehlani", title: "Safe", note: "Best Hip-Hop at the 2026 VMAs.", video: "E_0y8bmIATM", kind: "Official video" },
  { artist: "Bad Bunny", title: "NUEVAYoL", note: "Best Latin at the 2026 VMAs.", video: "KU5V5WZVcVE", kind: "Official video" },
  { artist: "LISA feat. Kentaro Sakaguchi", title: "Dream", note: "Best Pop at the 2026 VMAs, shot as a short film.", video: "FMX98ROVRCE", kind: "Official short film" },
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
