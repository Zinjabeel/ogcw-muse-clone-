import type { ShopBrand, ShopProduct, ShopTag } from "./shop";
import { EXTRA, EXTRA_BRANDS } from "./shop-extra";
import { FACTS, MORE } from "./shop-more";

// The shop's live catalogue (owner, 14 Oct 2026): sneakers and jeans picked
// on GOAT, watches picked on Watchfinder & Co., and the hoodies and tees from
// the owner's "pictures for the shop section" file, then the rest of the
// catalogue from the same shops (src/data/shop-more.ts). Every piece has two
// photos where the shop has them: the first on the card, the second under
// the pointer. Names, colourways, references, sizes and years are as the
// shop lists them, and each piece links to its own page there. Prices are
// the shop's, in US dollars, as it showed them on 14 Oct 2026.
// Photos: GOAT and Watchfinder & Co. product photos, resized.

const goat = (path: string) => `https://www.goat.com/${path}`;
const wf = (path: string) => `https://www.watchfinder.com/watches/${path}`;
const photos = (id: string) => ({ image: `/shop/products/${id}-1.jpg`, back: `/shop/products/${id}-2.jpg`, stage: "white" as const });
const picks = (front: string, back: string) => ({ image: `/shop/picks/${front}.jpg`, back: `/shop/picks/${back}.jpg`, stage: "white" as const });

export const CATALOG_BRANDS: ShopBrand[] = [
  // The shops
  { slug: "goat", name: "GOAT", blurb: "Sneakers and streetwear, new and pre-owned, each pair checked before it ships.", site: "https://www.goat.com", search: (query) => `https://www.goat.com/search?query=${encodeURIComponent(query)}`, store: true },
  { slug: "watchfinder", name: "Watchfinder & Co.", blurb: "Pre-owned luxury watches, serviced and sold with a warranty.", site: "https://www.watchfinder.com", search: (query) => `https://www.watchfinder.com/search?q=${encodeURIComponent(query)}`, store: true },
  // Denim and streetwear
  { slug: "levis", name: "Levi’s", blurb: "The 501, the original blue jean, since 1873.", site: "https://www.levi.com" },
  { slug: "denim-tears", name: "Denim Tears", blurb: "Tremaine Emory’s label, known for the cotton wreath print.", site: "https://denimtears.com" },
  { slug: "sp5der", name: "Sp5der", blurb: "Young Thug’s label, known for its spider-web hoodies.", site: "https://sp5derworldwide.com" },
  { slug: "amiri", name: "Amiri", blurb: "Mike Amiri’s Los Angeles label, known for distressed denim.", site: "https://amiri.com" },
  { slug: "ksubi", name: "Ksubi", blurb: "The denim label from Sydney.", site: "https://ksubi.com" },
  { slug: "purple-brand", name: "Purple Brand", blurb: "Los Angeles denim, waxed, washed and distressed.", site: "https://purple-brand.com" },
  { slug: "hellstar", name: "Hellstar", blurb: "Los Angeles streetwear with the star logo.", site: "https://hellstar.com" },
  { slug: "butter-goods", name: "Butter Goods", blurb: "The skate label from Australia.", site: "https://buttergoods.com" },
  { slug: "acne-studios", name: "Acne Studios", blurb: "The Stockholm fashion house that began with denim.", site: "https://www.acnestudios.com" },
  { slug: "magliano", name: "Magliano", blurb: "Luca Magliano’s label from Bologna.", site: "https://www.goat.com/search?query=Magliano" },
  { slug: "cactus-jack", name: "Cactus Jack", blurb: "Travis Scott’s label and record imprint.", site: "https://shop.travisscott.com" },
  { slug: "nocta", name: "NOCTA", blurb: "Drake’s label, made with Nike.", site: "https://nocta.com" },
  // Watches
  { slug: "tudor", name: "Tudor", blurb: "Rolex’s sister brand: the Black Bay and the Pelagos.", site: "https://www.tudorwatch.com" },
  { slug: "blancpain", name: "Blancpain", blurb: "The Swiss maker of the Fifty Fathoms dive watch.", site: "https://www.blancpain.com" },
  { slug: "vacheron-constantin", name: "Vacheron Constantin", blurb: "Geneva watchmaking since 1755.", site: "https://www.vacheron-constantin.com" },
  { slug: "panerai", name: "Panerai", blurb: "Italian dive watches: the Luminor and the Radiomir.", site: "https://www.panerai.com" },
  { slug: "grand-seiko", name: "Grand Seiko", blurb: "Seiko’s top line, finished by hand in Japan.", site: "https://www.grand-seiko.com" },
  { slug: "jaeger-lecoultre", name: "Jaeger-LeCoultre", blurb: "The Vallée de Joux house behind the Reverso.", site: "https://www.jaeger-lecoultre.com" },
  { slug: "hublot", name: "Hublot", blurb: "The Big Bang, and gold paired with rubber.", site: "https://www.hublot.com" },
  { slug: "breitling", name: "Breitling", blurb: "Pilot’s chronographs, and the Navitimer.", site: "https://www.breitling.com" },
  { slug: "bell-ross", name: "Bell & Ross", blurb: "Square cases taken from aircraft instruments.", site: "https://www.bellross.com" },
  // Stadium Goods, and the labels it brought in (src/data/shop-extra.ts)
  ...EXTRA_BRANDS,
];

type Row = Omit<ShopProduct, "image" | "credit"> & { image?: string };
const sneaker = (id: string, brand: string, name: string, colour: string, kind: string, path: string, tags: ShopTag[], released: string): ShopProduct =>
  ({ id, brand, name, colour, category: "Sneakers", kind, ...photos(id), credit: "Photo: GOAT", photoPage: goat(path), retailer: "goat", url: goat(path), tags, released });
const jeans = (id: string, brand: string, name: string, colour: string, path: string, tags: ShopTag[] = []): ShopProduct =>
  ({ id, brand, name, colour, category: "Clothing", kind: "Jeans", ...photos(id), credit: "Photo: GOAT", photoPage: goat(`apparel/${path}`), retailer: "goat", url: goat(`apparel/${path}`), tags });
const watch = (id: string, brand: string, name: string, colour: string, note: string, path: string, tags: ShopTag[] = []): ShopProduct =>
  ({ id, brand, name, colour, category: "Accessories", kind: "Watches", note, ...photos(id), credit: "Photo: Watchfinder & Co.", photoPage: wf(path), retailer: "watchfinder", url: wf(path), tags });
const pick = (row: Row & { image: string; back: string }): ShopProduct => ({ credit: "Photo: the owner’s pick", retailer: "goat", stage: "white", ...row });

const FIRST: ShopProduct[] = [
  // ---------- Sneakers (GOAT) ----------
  sneaker("aj1-royal-2026", "jordan", "Air Jordan 1 Retro High OG ‘Royal’ 2026", "Black / Varsity Royal / Black", "Basketball", "sneakers/air-jordan-1-retro-high-og-royal-2026-iq5495-005", ["new", "trending", "drops"], "2026-10-10"),
  sneaker("aj4-black-cat-2025", "jordan", "Air Jordan 4 Retro ‘Black Cat’ 2025", "Black / Black / Light Graphite", "Basketball", "sneakers/air-jordan-4-retro-black-cat-2025-fv5029-010", ["trending"], "2025-11-28"),
  sneaker("aj4-rare-air-tour-yellow", "jordan", "Air Jordan 4 Retro ‘Rare Air – Tour Yellow’ 2026", "White / Tour Yellow / Dark Blue Grey / Black", "Basketball", "sneakers/air-jordan-4-retro-rare-air-tour-yellow-io2463-102", ["new", "drops"], "2026-09-05"),
  sneaker("aj5-black-carolina-2026", "jordan", "Air Jordan 5 Retro ‘Black Carolina / UNC’ 2026", "Black / University Blue / White", "Basketball", "sneakers/air-jordan-5-retro-black-university-blue-2026-dd0587-008", ["drops"], "2026-06-20"),
  sneaker("aj11-gamma-blue-2025", "jordan", "Air Jordan 11 Retro ‘Gamma Blue’ 2025", "Black / Gamma Blue / Varsity Maize", "Basketball", "sneakers/air-jordan-11-retro-gamma-blue-2025-ct8012-017", ["trending"], "2025-12-13"),
  sneaker("aj3-true-blue-2026", "jordan", "Air Jordan 3 ‘True Blue’ 2026", "White / True Blue / Fire Red", "Basketball", "sneakers/air-jordan-3-true-blue-2026-if4396-104", ["drops"], "2026-07-18"),
  sneaker("fragment-travis-aj1-low-military-blue", "jordan", "Fragment Design x Travis Scott x Air Jordan 1 Retro Low OG SP ‘Sail Military Blue’", "Sail / Black / Muslin / Military Blue", "Basketball", "sneakers/fragment-design-x-travis-scott-x-air-jordan-1-low-og-sp-sail-military-blue-dm7866-104", ["trending", "limited"], "2025-11-15"),
  sneaker("nigel-sylvester-aj4-brick-after-brick", "jordan", "Nigel Sylvester x Air Jordan 4 Retro OG SP ‘Brick After Brick’", "Sail / Cinnabar / Anthracite / Muslin", "Basketball", "sneakers/nigel-sylvester-x-air-jordan-4-retro-og-sail-iq8055-100", ["limited", "drops"], "2026-05-22"),
  sneaker("awake-ny-aj6-blueberry", "jordan", "Awake NY x Air Jordan 6 Retro ‘Blueberry’", "Midnight Navy / Infrared 23 / Game Royal / Light Blue", "Basketball", "sneakers/awake-ny-x-air-jordan-6-retro-midnight-navy-infrared-iq5706-400", ["new", "limited", "drops"], "2026-08-29"),
  sneaker("aj13-flint-2026", "jordan", "Air Jordan 13 Retro ‘Flint’ 2026", "Navy / University Blue / Flint Grey / White", "Basketball", "sneakers/air-jordan-13-retro-flint-2026-iw3808-400", ["new", "drops"], "2026-08-01"),
  sneaker("travis-scott-af1-ice-blue", "nike", "Travis Scott x Nike Air Force 1 Low ’07 ‘Ice Blue’", "Ice Blue / Celestine Blue", "Basketball", "sneakers/travis-scott-x-nike-air-force-1-low-07-ice-blue-jf7727-400", ["limited", "drops"], "2026-10-30"),
  sneaker("nike-air-bakin-varsity-red", "nike", "Nike Air Bakin ‘Varsity Red’ 2026", "Varsity Red / White / Varsity Maize / Black", "Basketball", "sneakers/nike-air-bakin-varsity-red-2026-iq5365-600", ["new", "drops"], "2026-09-29"),
  sneaker("huf-air-max-1-orange", "nike", "HUF x Nike Air Max 1 SP ‘Orange’", "Anthracite / Brilliant Orange / Medium Grey / Gunsmoke", "Running", "sneakers/huf-x-air-max-1-sp-brilliant-orange-hf3713-001", ["limited"], "2024-06-22"),
  sneaker("samba-og-cheetah-preloved-red", "adidas", "adidas Wmns Samba OG ‘Cheetah Pack – Preloved Red’", "Core Black / Preloved Red / Cream White", "Lifestyle", "sneakers/wmns-samba-og-preloved-red-leopard-ji2734", ["trending"], "2025-01-30"),
  sneaker("yeezy-350-v2-onyx", "adidas", "adidas Yeezy Boost 350 V2 ‘Onyx’", "Onyx / Onyx / Onyx", "Lifestyle", "sneakers/yeezy-boost-350-v2-onyx-hq4540", ["trending"], "2022-06-20"),
  sneaker("nb-9060-black-cat", "new-balance", "New Balance 9060 ‘Black Cat’", "Black", "Running", "sneakers/9060-black-grey-u9060zge", ["trending"], "2025-03-01"),
  sneaker("nb-2002r-protection-pack-phantom", "new-balance", "New Balance 2002R ‘Protection Pack – Phantom’", "Phantom / Magnet", "Running", "sneakers/2002r-protection-pack-phantom-m2002rdb", [], "2021-08-13"),
  sneaker("nb-1906r-silver-metallic-black", "new-balance", "New Balance 1906R ‘Silver Metallic Black’", "Silver Metallic / Black / Sea Salt", "Running", "sneakers/1906r-silver-metallic-black-m1906rer", [], "2024-06-01"),
  sneaker("nb-550-white-grey", "new-balance", "New Balance 550 ‘White Grey’", "White", "Basketball", "sneakers/550-white-grey-bb550pb1", [], "2022-07-01"),
  sneaker("asics-gel-1130-black-pure-silver", "asics", "ASICS Gel 1130 ‘Black Pure Silver’", "Black / Pure Silver", "Running", "sneakers/gel-1130-black-pure-silver-1201a906-001", [], "2023-05-31"),

  // ---------- Jeans (GOAT) ----------
  jeans("levis-denim-tears-logo-japan-jeans", "levis", "Levi’s x Denim Tears Logo Japan Embroidered Denim Jeans", "Blue", "levi-s-x-denim-tears-logo-japan-embroidered-denim-jeans-blue-dt-s22-0000-010", ["trending", "limited"]),
  jeans("levis-denim-tears-crystal-jeans", "levis", "Levi’s x Denim Tears Crystal Denim Jeans", "Blue", "levi-s-x-denim-tears-crystal-denim-jeans-blue-pc9-a1592-0000", ["limited"]),
  jeans("denim-tears-builder-pant-light-indigo", "denim-tears", "Denim Tears Builder Denim Pant", "Light Indigo", "denim-tears-builder-denim-pant-light-indigo-fw24bpb0941"),
  jeans("denim-tears-baggy-pant-selvedge", "denim-tears", "Denim Tears Baggy Denim Pant", "Selvedge", "denim-tears-baggy-denim-pant-selvedge-05650-1002505dtbdps-selv", ["new"]),
  jeans("denim-tears-patchwork-pant-blue", "denim-tears", "Denim Tears Patchwork Denim Pant", "Blue", "denim-tears-patchwork-denim-pant-blue-05650-1002505dtpdpb-blue", ["new", "trending"]),
  jeans("sp5der-denim-v3-indigo", "sp5der", "Sp5der Denim V3 Jeans", "Indigo Denim", "sp5der-denim-v3-jeans-indigo-denim-p16fw24ind", ["trending"]),
  jeans("amiri-carpenter-jeans-aged-black", "amiri", "Amiri Denim Carpenter Jeans", "Aged Black", "amiri-denim-carpenter-jeans-aged-black-ss22mdf008-aged"),
  jeans("amiri-mx1-neon-plaid-indigo", "amiri", "Amiri MX1 Neon Plaid Skinny Denim Jeans", "Indigo", "amiri-mx1-neon-plaid-skinny-denim-jeans-indigo-pf22mds082-408-indi"),
  jeans("amiri-bandana-mx1-blue", "amiri", "Amiri Bandana MX1 Denim Skinny Jeans", "Blue", "amiri-bandana-mx1-denim-skinny-jeans-blue-ss22mds002-485-blue"),
  jeans("ksubi-maxx-astral-kraftwerk", "ksubi", "Ksubi Maxx Astral Kraftwerk Jeans", "Denim", "ksubi-maxx-astral-kraftwerk-jeans-denim-ksumpf26dj038-098", ["new"]),
  jeans("ksubi-chitch-chronicle-trashed", "ksubi", "Ksubi Chitch Chronicle Trashed Jeans", "Denim", "ksubi-chitch-chronicle-trashed-jeans-denim-mpf22dj007"),
  jeans("purple-brand-low-rise-slim-black", "purple-brand", "Purple Brand Low Rise Slim Jeans", "Black", "purple-brand-low-rise-skinny-jeans-black-p001-blkr222"),
  jeans("purple-brand-baggy-black", "purple-brand", "Purple Brand Baggy Denim Skinny Jeans", "Black", "purple-brand-baggy-denim-skinny-jeans-black-p018-sjwb723"),
  jeans("hellstar-denim-blue", "hellstar", "Hellstar Denim Jeans", "Blue", "hellstar-denim-jeans-blue-hscxpnt01-blue", ["trending"]),
  jeans("butter-goods-relaxed-sunfade", "butter-goods", "Butter Goods Relaxed Denim Jeans", "Sunfade Blue", "butter-goods-relaxed-denim-jeans-sunfade-blue-bgq22616101", ["new"]),
  jeans("butter-goods-solar-fade-grey", "butter-goods", "Butter Goods Solar Fade Denim Jeans", "Grey Wash", "butter-goods-solar-fade-denim-jeans-grey-wash-bgq3267102", ["new"]),
  jeans("acne-studios-printed-jeans-blue", "acne-studios", "Acne Studios Denim Printed Jeans", "Blue", "acne-studios-denim-printed-jeans-blue-b00374-goat-blue"),
  jeans("supreme-dickies-cordura-cargo-denim", "supreme", "Supreme x Dickies Cordura Cargo Pant", "Denim", "supreme-x-dickies-cordura-cargo-pant-denim-fw25p18-denim", ["limited"]),
  jeans("magliano-flattone-filthy-white", "magliano", "Magliano Flattone Denim Pants", "Filthy White", "magliano-flattone-denim-pants-filthy-white-mgss26dp01012-6119", ["new"]),

  // ---------- Watches (Watchfinder & Co., pre-owned) ----------
  watch("omega-seamaster-300m-blue", "omega", "Seamaster Diver 300M", "Blue dial, steel bracelet", "Pre-owned, 2024 · 210.30.42.20.03.001", "omega/seamaster-diver-300m/210-30-42-20-03-001/432062", ["trending"]),
  watch("tudor-black-bay-chrono-blue", "tudor", "Black Bay Chrono", "Blue dial, steel bracelet", "Pre-owned, 2024 · M79360B-0002", "tudor/black-bay-chrono/m79360b-0002/430389", ["new"]),
  watch("tudor-black-bay-58-black", "tudor", "Black Bay 58", "Black dial, leather strap", "Pre-owned, 2019 · M79030N-0002", "tudor/black-bay-58/m79030n-0002/449476"),
  watch("rolex-land-dweller-36", "rolex", "Land-Dweller 36", "White honeycomb dial", "Pre-owned, 2026 · 127234", "rolex/land-dweller-36/127234/445120", ["new", "trending", "limited"]),
  watch("rolex-explorer-114270", "rolex", "Explorer", "Black dial, steel bracelet", "Vintage, 2001 · 114270", "rolex/explorer/114270/443979", ["trending"]),
  watch("cartier-roadster-silver", "cartier", "Roadster", "Silver Roman numeral dial", "Pre-owned, 2006 · W62032X6", "cartier/roadster/w62032x6/442307"),
  watch("rolex-air-king-14000m", "rolex", "Air-King", "Black baton dial, steel bracelet", "Pre-owned, 2004 · 14000M", "rolex/air-king/14000m/441626"),
  watch("blancpain-fifty-fathoms-blue", "blancpain", "Fifty Fathoms", "Blue dial, fabric strap", "Pre-owned, 2016 · 5000-0240-O52A", "blancpain/fifty-fathoms/5000-0240-o52a/432732", ["limited"]),
  watch("tag-heuer-carrera-black", "tag-heuer", "Carrera", "Black baton dial, leather strap", "Pre-owned, 2005 · CV2113.FC6181", "tag-heuer/carrera/cv2113-fc6181/433425"),
  watch("cartier-tank-basculante", "cartier", "Tank Basculante", "Silver Roman numeral dial, leather strap", "Pre-owned, 2003 · W1011258", "cartier/tank-basculante/w1011258/416757", ["trending"]),
  watch("vacheron-patrimony-rose-gold", "vacheron-constantin", "Patrimony", "Ivory baton dial, leather strap", "Pre-owned, 2008 · 85180/000R-9248", "vacheron-constantin/patrimony/85180-000r-9248/439735", ["limited"]),
  watch("panerai-radiomir-manual-white", "panerai", "Radiomir Manual", "White dial, leather strap", "Pre-owned, 2025 · PAM01384", "panerai/radiomir-manual/pam01384/449699", ["new"]),
  watch("grand-seiko-sbgj273-red", "grand-seiko", "Elegance Collection", "Red dial, steel bracelet", "Pre-owned, 2024 · SBGJ273", "grand-seiko/elegance-collection/sbgj273/449697", ["new"]),
  watch("jlc-polaris-grey", "jaeger-lecoultre", "Polaris", "Grey dial, fabric strap", "Pre-owned, 2023 · 902843J", "jaeger-lecoultre/polaris/902843j/450944"),
  watch("omega-speedmaster-145-022", "omega", "Speedmaster Moonwatch", "Black baton dial", "Vintage, 1988 · ST 145.022", "omega/speedmaster-moonwatch/st-145-022/436349", ["trending", "limited"]),
  watch("hublot-f1", "hublot", "F1", "Black and red dial, fabric strap", "Vintage, 2001 · 703.CI.1123.NR.FMO10", "hublot/f1/703-ci-1123-nr-fmo10/449615", ["limited"]),
  watch("rolex-datejust-16233", "rolex", "Datejust", "Ivory pyramid Roman numeral dial, steel and gold", "Vintage, 1993 · 16233", "rolex/datejust/16233/440825", ["trending"]),
  watch("breitling-navitimer-b01-46", "breitling", "Navitimer B01 Chronograph 46", "Black baton dial", "Pre-owned, 2021 · AB0127", "breitling/navitimer-b01-chronograph-46/ab0127/442308"),
  watch("bell-ross-br05-blue", "bell-ross", "BR 05", "Blue dial, steel bracelet", "Pre-owned, 2024 · BR05G-PB-ST/SST", "bell-and-ross/br-05/br05g-pb-st-sst/433812"),

  // ---------- Hoodies and tees: the owner's pictures (two links per piece) ----------
  pick({ id: "sp5der-pnk-hoodie", brand: "sp5der", name: "Sp5der P*nk Web Hoodie", colour: "Pink", category: "Clothing", kind: "Hoodies & sweats", tags: ["trending"], ...picks("sp5der-pnk-hoodie-front", "sp5der-pnk-hoodie-back") }),
  pick({ id: "sp5der-og-web-hoodie", brand: "sp5der", name: "Sp5der OG Web Hoodie", colour: "Black", category: "Clothing", kind: "Hoodies & sweats", tags: ["trending"], ...picks("sp5der-og-web-hoodie-front", "sp5der-og-web-hoodie-back") }),
  pick({ id: "sp5der-splat-punk-hoodie", brand: "sp5der", name: "Sp5der Splat Punk Hoodie", colour: "Slate grey", category: "Clothing", kind: "Hoodies & sweats", tags: ["new"], ...picks("sp5der-splat-punk-hoodie-front", "sp5der-splat-punk-hoodie-back") }),
  pick({ id: "sp5der-beluga-hoodie", brand: "sp5der", name: "Sp5der Beluga Hoodie", colour: "Brown", category: "Clothing", kind: "Hoodies & sweats", tags: ["new"], ...picks("sp5der-beluga-hoodie-front", "sp5der-beluga-hoodie-back") }),
  pick({ id: "days-before-rodeo-hoodie", brand: "cactus-jack", name: "Cactus Jack x Sp5der Days Before Rodeo Hoodie", colour: "Brown", category: "Clothing", kind: "Hoodies & sweats", tags: ["limited", "trending"], ...picks("days-before-rodeo-hoodie-front", "days-before-rodeo-hoodie-back") }),
  pick({ id: "circus-maximus-hoodie", brand: "cactus-jack", name: "Travis Scott Circus Maximus Tour ’23 Hoodie", colour: "White", category: "Clothing", kind: "Hoodies & sweats", tags: ["limited"], ...picks("circus-maximus-hoodie-front", "circus-maximus-hoodie-back") }),
  pick({ id: "utopia-hoodie", brand: "cactus-jack", name: "Travis Scott Utopia Hoodie", colour: "Brown", category: "Clothing", kind: "Hoodies & sweats", ...picks("utopia-hoodie-front", "utopia-hoodie-back") }),
  pick({ id: "apple-pie-hoodie", brand: "cactus-jack", name: "Cactus Jack x McDonald’s Apple Pie Hoodie", colour: "Black", category: "Clothing", kind: "Hoodies & sweats", tags: ["limited"], ...picks("apple-pie-hoodie-front", "apple-pie-hoodie-back") }),
  pick({ id: "cactus-jack-barcelona-hoodie", brand: "cactus-jack", name: "Cactus Jack x Nike x FC Barcelona Hoodie", colour: "Washed black", category: "Clothing", kind: "Hoodies & sweats", tags: ["limited", "trending"], ...picks("cactus-jack-barcelona-hoodie-front", "cactus-jack-barcelona-hoodie-back") }),
  pick({ id: "nocta-nike-canada-hoodie", brand: "nocta", name: "NOCTA x Nike Canada Hoodie", colour: "Yellow and navy", category: "Clothing", kind: "Hoodies & sweats", tags: ["limited"], ...picks("nocta-nike-canada-hoodie-front", "nocta-nike-canada-hoodie-back") }),
  // The owner's two links for this one are two colours of the same hoodie, not a front and a back
  pick({ id: "nike-centre-swoosh-hoodie", brand: "nike", name: "Nike Centre Swoosh Hoodie", colour: "Teal, or brown", category: "Clothing", kind: "Hoodies & sweats", ...picks("nike-centre-swoosh-hoodie-teal", "nike-centre-swoosh-hoodie-brown") }),
  // Official name not confirmed, so the name only describes it (and it's listed under the shop)
  pick({ id: "tiger-totem-hoodie", brand: "goat", name: "Washed Black Tiger and Totem Hoodie", colour: "Washed black", category: "Clothing", kind: "Hoodies & sweats", ...picks("tiger-totem-hoodie-front", "tiger-totem-hoodie-back") }),
  pick({ id: "kaws-fragment-tee", brand: "cactus-jack", name: "Cactus Jack x KAWS for Fragment Tee", colour: "Vintage wash", category: "Clothing", kind: "T-shirts & shirts", tags: ["limited"], ...picks("kaws-fragment-tee-front", "kaws-fragment-tee-back") }),
  pick({ id: "mcdonalds-smile-tee", brand: "cactus-jack", name: "Cactus Jack x McDonald’s Smile Tee", colour: "Black", category: "Clothing", kind: "T-shirts & shirts", ...picks("mcdonalds-smile-tee-front", "mcdonalds-smile-tee-back") }),
  pick({ id: "fragment-tee", brand: "cactus-jack", name: "Cactus Jack for Fragment Tee", colour: "White", category: "Clothing", kind: "T-shirts & shirts", tags: ["limited"], ...picks("fragment-tee-front", "fragment-tee-back") }),
  pick({ id: "cactus-jack-script-tee", brand: "cactus-jack", name: "Cactus Jack Back-Script Tee", colour: "Cream", category: "Clothing", kind: "T-shirts & shirts", ...picks("cactus-jack-script-tee-front", "cactus-jack-script-tee-back") }),
  pick({ id: "cactus-mac-tee", brand: "cactus-jack", name: "Cactus Jack x McDonald’s Cactus Mac Tee", colour: "Black", category: "Clothing", kind: "T-shirts & shirts", tags: ["trending"], ...picks("cactus-mac-tee-front", "cactus-mac-tee-back") }),
];

// The owner's pieces we couldn't match to one GOAT page: no price, and the
// sizes these labels make their hoodies and tees in
const OWN_SIZES: Partial<ShopProduct> = { sizeLabel: "Size", sizes: ["S", "M", "L", "XL", "XXL"] };
const UNMATCHED = new Set(["utopia-hoodie", "cactus-jack-barcelona-hoodie", "nike-centre-swoosh-hoodie", "tiger-totem-hoodie", "mcdonalds-smile-tee", "cactus-jack-script-tee"]);

export const CATALOG: ShopProduct[] = [
  ...FIRST.map((product) => ({ ...product, ...(UNMATCHED.has(product.id) ? OWN_SIZES : {}), ...FACTS[product.id] })),
  ...MORE,
  ...EXTRA,
];

export const CATALOG_IDS = new Set(CATALOG.map((product) => product.id));
export const catalogOf = (kind: string) => CATALOG.filter((product) => product.kind === kind);
