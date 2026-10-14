// The shop's "Upcoming" page: the pairs on the calendar, as news. Dates are
// Just Fresh Kicks' Air Jordan release dates (page updated 14 Oct 2026);
// photos and the "See it on GOAT" links are GOAT's listing for each pair.
// No prices: each shop sets its own.

export const UPCOMING_SOURCE = { name: "Just Fresh Kicks: Air Jordan release dates", updated: "2026-10-14", url: "https://justfreshkicks.com/air-jordan-release-dates/" };

export type UpcomingPair = {
  id: string;
  date: string;
  name: string;
  /** The colourway, as GOAT lists it */
  colour?: string;
  photo?: string;
  goat?: string;
  /** A note under the name */
  note?: string;
  /** In the shop already: its product page */
  product?: string;
};

const goat = (slug: string) => `https://www.goat.com/sneakers/${slug}`;
const photo = (id: string) => `/shop/upcoming/${id}.png`;

export const UPCOMING: UpcomingPair[] = [
  { id: "aj5-halloween", date: "2026-10-17", name: "Air Jordan 5 “Halloween”", colour: "Black / Multi-Color", photo: photo("aj5-halloween"), goat: goat("air-jordan-5-retro-halloween-hq7978-001") },
  { id: "aj12-fireside", date: "2026-10-24", name: "Air Jordan 12 “Fireside”", colour: "Light Orewood Brown / Cacao Wow / Team Red", photo: photo("aj12-fireside"), goat: goat("air-jordan-12-retro-eggnog-ct8013-105") },
  { id: "aj41-university-red", date: "2026-10-25", name: "Air Jordan 41 “University Red”", colour: "University Red / Infrared 23", photo: photo("aj41-university-red"), goat: goat("air-jordan-41-university-red-hv6474-601") },
  { id: "wmns-aj3-fireside", date: "2026-10-30", name: "Air Jordan 3 “Fireside” (women’s)", colour: "Velvet Brown / Pearl White / Gum Dark Brown", photo: photo("wmns-aj3-fireside"), goat: goat("wmns-air-jordan-3-retro-fireside-ck9246-200") },
  { id: "travis-scott-af1-ice-blue", date: "2026-10-30", name: "Travis Scott x Nike Air Force 1 Low ’07 “Ice Blue”", colour: "Ice Blue / Celestine Blue", photo: "/shop/products/travis-scott-af1-ice-blue-1.jpg", goat: goat("travis-scott-x-nike-air-force-1-low-07-ice-blue-jf7727-400"), note: "Date as GOAT lists it", product: "travis-scott-af1-ice-blue" },
  { id: "aj14-forest-green", date: "2026-10-31", name: "Air Jordan 14 “Forest Green”", colour: "White / Black / Dark Forest / Light Graphite", photo: photo("aj14-forest-green"), goat: goat("air-jordan-14-retro-forest-green-487471-300") },
  { id: "aj4-light-army", date: "2026-10-31", name: "Air Jordan 4 “Light Army”", colour: "Light Army / Light Silver / Cargo Khaki / Phantom", photo: photo("aj4-light-army"), goat: goat("air-jordan-4-retro-light-army-ja5911-320") },
  { id: "aj41-space-jam", date: "2026-11-05", name: "Air Jordan 41 “Space Jam”", colour: "Black / Concord", goat: goat("air-jordan-41-space-jam-hv6474-002") },
  { id: "black-pack", date: "2026-11-07", name: "Air Jordan 15 and 17 Low “Black Pack”", goat: goat("air-jordan-15-black-pack-iz2585-001") },
  { id: "aj6-white-infrared", date: "2026-11-07", name: "Air Jordan 6 “White Infrared”", colour: "White / Infrared / Black", photo: photo("aj6-white-infrared"), goat: goat("air-jordan-6-retro-og-white-infrared-ct8529-105") },
  { id: "wmns-aj11-magic-ball", date: "2026-11-11", name: "Air Jordan 11 “Magic Ball” and “Lapis” (women’s)", colour: "Magic Ball: Light British Tan / Off Noir / Metallic Silver", photo: photo("wmns-aj11-magic-ball"), goat: goat("air-jordan-11-retro-wmns-magic-ball-iz1800-200") },
  { id: "aj11-green-screen", date: "2026-11-14", name: "Air Jordan 11 “Green Screen”", colour: "Multi-Color / Gym Green / Lucky Green / Orange", photo: photo("aj11-green-screen"), goat: goat("air-jordan-11-retro-space-jam-galaxy-iq5700-900") },
  { id: "aj3-not-nice", date: "2026-11-21", name: "Air Jordan 3 “Not Nice”", colour: "Black / Challenge Red / Off Noir / Elemental Gold", goat: goat("air-jordan-3-retro-not-nice-if4396-001"), note: "Plus the “Lola Bunny” for kids the same day" },
  { id: "aj4-bred-2026", date: "2026-11-27", name: "Air Jordan 4 “Bred”", colour: "Black / Cement Grey / Summit White / Fire Red", photo: photo("aj4-bred-2026"), goat: goat("air-jordan-4-retro-og-bred-2026-ix8180-001") },
  { id: "free-the-youth-aj3", date: "2026-12-04", name: "Free The Youth x Air Jordan 3" },
  { id: "aj10-sacramento", date: "2026-12-05", name: "Air Jordan 10 “Sacramento”", colour: "Black / Metallic Silver / Dark Concord", photo: photo("aj10-sacramento"), goat: goat("air-jordan-10-retro-og-sacramento-hj6779-002") },
  { id: "jaide-aj1-low", date: "2026-12-11", name: "JAIDE x Air Jordan 1 Low OG (women’s)" },
  { id: "aj11-space-jam-2026", date: "2026-12-12", name: "Air Jordan 11 “Space Jam”", colour: "Black / Varsity Royal / White", photo: photo("aj11-space-jam-2026"), goat: goat("air-jordan-11-retro-space-jam-2026-ct8012-900") },
  { id: "aj4-pink-thunder", date: "2026-12-19", name: "Air Jordan 4 “Pink Thunder”", colour: "Black / White / Rust Pink", photo: photo("wmns-aj4-rust-pink-thunder"), goat: goat("wmns-air-jordan-4-retro-rust-pink-thunder-hv0823-001") },
  { id: "aj8-knicks", date: "2026-12-24", name: "Air Jordan 8 “Knicks”", colour: "Black / Safety Orange / Racer Blue", photo: photo("aj8-knicks"), goat: goat("air-jordan-8-retro-knicks-ix8479-010") },
  { id: "aj4-bin-23", date: "2026-12-26", name: "Air Jordan 4 “BIN 23”", colour: "Fauna Brown / Baroque Brown / Muslin / Gym Red", photo: photo("aj4-bin-23"), goat: goat("air-jordan-4-retro-4-bin-23-ja3588-200") },
  // Further out: 2027, with the date GOAT lists (Just Fresh Kicks' page stops at December)
  { id: "aj12-obsidian-2027", date: "2027-01-23", name: "Air Jordan 12 “Obsidian”", colour: "Obsidian / White / University Blue", photo: "https://image.goat.com/750/attachments/product_template_pictures/images/117/790/760/original/CT8013_20401.png.png", goat: goat("air-jordan-12-retro-obsidian-2027-ct8013-401"), note: "Date as GOAT lists it" },
  { id: "aj3-white-cement-2027", date: "2027-05-22", name: "Air Jordan 3 “White Cement”", colour: "Summit White / Fire Red / Cement Grey / Black", photo: "https://image.goat.com/750/attachments/product_template_pictures/images/117/874/675/original/JJ1473_20100.png.png", goat: goat("air-jordan-3-retro-og-white-cement-jj1473-100"), note: "Date as GOAT lists it" },
];
