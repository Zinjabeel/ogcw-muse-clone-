import { SHOPS } from "./content";
import { DROPS } from "./drops";

// The OGCW Shop: brands and products, every one bought straight from the
// retailer ("Shop at …" links out; OGCW takes no payments and keeps no
// stock). Prices are guide retail prices in euros; where we couldn't
// confirm one, the product shows "Price at the retailer" instead. Product
// photos are free-licence photos from Wikimedia Commons (credited on every
// product page) or, for the original four shops, from Unsplash.

export type ShopCategory = "Sneakers" | "Clothing" | "Accessories" | "Tech & play";
export const SHOP_CATEGORIES: { id: ShopCategory; slug: string; blurb: string }[] = [
  { id: "Sneakers", slug: "sneakers", blurb: "Runners, court classics, boots and the pairs on the release calendar." },
  { id: "Clothing", slug: "clothing", blurb: "Jackets, denim and the basics under every outfit." },
  { id: "Accessories", slug: "accessories", blurb: "Caps, watches, shades and bags." },
  { id: "Tech & play", slug: "tech", blurb: "Consoles, controllers, headphones, cameras and the ball for opening night." },
];

export type ShopBrand = { slug: string; name: string; blurb: string; site: string; search?: (q: string) => string };
const q = (base: string) => (query: string) => base + encodeURIComponent(query);

export const BRANDS: ShopBrand[] = [
  { slug: "nike", name: "Nike", blurb: "Air Max, Dunks, Cortez and the icons that never left the rotation.", site: "https://www.nike.com", search: q("https://www.nike.com/w?q=") },
  { slug: "jordan", name: "Jordan", blurb: "Retro Jordans, from the 1 to the 4, and the dates they drop.", site: "https://www.nike.com/jordan", search: q("https://www.nike.com/w?q=") },
  { slug: "adidas", name: "Adidas", blurb: "Sambas, Spezials, Stan Smiths and the Originals line.", site: "https://www.adidas.com", search: q("https://www.adidas.com/search?q=") },
  { slug: "new-balance", name: "New Balance", blurb: "Grey suede, dad shoes done right, and the 550.", site: "https://www.newbalance.com", search: q("https://www.newbalance.com/search?q=") },
  { slug: "asics", name: "Asics", blurb: "The GEL runners that went from the track to the street.", site: "https://www.asics.com", search: q("https://www.asics.com/search?q=") },
  { slug: "converse", name: "Converse", blurb: "The Chuck Taylor: a century old and still on every stage.", site: "https://www.converse.com", search: q("https://www.converse.com/search?q=") },
  { slug: "puma", name: "Puma", blurb: "The Suede, the Speedcat and terrace-era classics.", site: "https://eu.puma.com", search: q("https://eu.puma.com/search?q=") },
  { slug: "on", name: "On", blurb: "Swiss running shoes with the cloud sole.", site: "https://www.on.com" },
  { slug: "salomon", name: "Salomon", blurb: "Trail shoes the fashion crowd borrowed from the mountains.", site: "https://www.salomon.com", search: q("https://www.salomon.com/search?q=") },
  { slug: "dr-martens", name: "Dr. Martens", blurb: "The 1460 boot and the 1461 shoe, unchanged since the sixties.", site: "https://www.drmartens.com", search: q("https://www.drmartens.com/search?text=") },
  { slug: "birkenstock", name: "Birkenstock", blurb: "Cork footbeds, the Arizona and summer on repeat.", site: "https://www.birkenstock.com", search: q("https://www.birkenstock.com/search?q=") },
  { slug: "crocs", name: "Crocs", blurb: "The Classic Clog, love it or not.", site: "https://www.crocs.com", search: q("https://www.crocs.com/search?q=") },
  { slug: "arcteryx", name: "Arc’teryx", blurb: "Technical shells and down from Vancouver, worn far from any mountain.", site: "https://arcteryx.com", search: q("https://arcteryx.com/search?q=") },
  { slug: "carhartt", name: "Carhartt", blurb: "Workwear in heavy duck canvas, broken in by skaters and rappers.", site: "https://www.carhartt.com", search: q("https://www.carhartt.com/search?q=") },
  { slug: "levis", name: "Levi’s", blurb: "The 501 and the Trucker Jacket, the blueprint for denim.", site: "https://www.levi.com", search: q("https://www.levi.com/search?q=") },
  { slug: "uniqlo", name: "Uniqlo", blurb: "Everyday essentials, simple and fairly priced.", site: "https://www.uniqlo.com" },
  { slug: "new-era", name: "New Era", blurb: "The 59FIFTY: the fitted cap of baseball and hip-hop.", site: "https://www.neweracap.com", search: q("https://www.neweracap.com/search?q=") },
  { slug: "casio", name: "Casio", blurb: "The F-91W and G-Shock: watches built to take a hit.", site: "https://www.casio.com", search: q("https://www.casio.com/search?q=") },
  { slug: "ray-ban", name: "Ray-Ban", blurb: "Aviators and browlines with the famous green lenses.", site: "https://www.ray-ban.com", search: q("https://www.ray-ban.com/search?q=") },
  { slug: "eastpak", name: "Eastpak", blurb: "The backpack on every school run and tour bus.", site: "https://www.eastpak.com" },
  { slug: "apple", name: "Apple", blurb: "Headphones for the commute and the studio.", site: "https://www.apple.com", search: q("https://www.apple.com/search/") },
  { slug: "nintendo", name: "Nintendo", blurb: "Switch 2, and everything coming to it.", site: "https://www.nintendo.com", search: q("https://www.nintendo.com/search/#q=") },
  { slug: "playstation", name: "PlayStation", blurb: "The controller you’ll hold on 19 November.", site: "https://www.playstation.com", search: q("https://www.playstation.com/search/?q=") },
  { slug: "fujifilm", name: "Fujifilm", blurb: "Instax: instant photos you can hold.", site: "https://www.instax.com" },
  { slug: "technics", name: "Technics", blurb: "The SL-1200: the DJ turntable that built club culture.", site: "https://www.technics.com" },
  { slug: "wilson", name: "Wilson", blurb: "The official ball of the NBA.", site: "https://www.wilson.com", search: q("https://www.wilson.com/en-us/search?q=") },
  { slug: "stockx", name: "StockX", blurb: "Sold-out pairs, verified and resold at market price.", site: "https://stockx.com", search: q("https://stockx.com/search?s=") },
];
export const getBrand = (slug: string) => BRANDS.find((brand) => brand.slug === slug);

export type ShopTag = "new" | "trending" | "gift" | "drops";
export type ShopProduct = {
  id: string;
  brand: string;
  name: string;
  colour: string;
  category: ShopCategory;
  /** A finer type: Running, Boots, Caps, Watches… */
  kind: string;
  /** Guide retail price in euros; none when we couldn't confirm it */
  price?: number;
  image: string;
  credit: string;
  photoPage?: string;
  tags?: ShopTag[];
  /** The OGCW story it belongs to */
  story?: string;
};

const PRODUCTS_NEW: ShopProduct[] = [
  { id: "nb-550-white-burgundy", brand: "new-balance", name: "550", colour: "White / Burgundy", category: "Sneakers", kind: "Basketball", price: 130, image: "https://upload.wikimedia.org/wikipedia/commons/7/75/New_Balance_550.jpg", credit: "LeDroider, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:New_Balance_550.jpg", tags: ["trending"] },
  { id: "nb-2002r-brown", brand: "new-balance", name: "2002R", colour: "Brown suede", category: "Sneakers", kind: "Running", price: 150, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/New_Balance_2002R.jpg/1280px-New_Balance_2002R.jpg", credit: "LeDroider, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:New_Balance_2002R.jpg", tags: ["new"] },
  { id: "asics-gel-1130", brand: "asics", name: "GEL-1130", colour: "White / Gold", category: "Sneakers", kind: "Running", price: 120, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Asics_Gel-1130.jpg/1280px-Asics_Gel-1130.jpg", credit: "LeDroider, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Asics_Gel-1130.jpg", tags: ["trending"] },
  { id: "asics-gel-kayano-14", brand: "asics", name: "GEL-Kayano 14", colour: "Cream / Green", category: "Sneakers", kind: "Running", price: 160, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Gel-Kayano_14_Artizia.jpg/1280px-Gel-Kayano_14_Artizia.jpg", credit: "LeDroider, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Gel-Kayano_14_Artizia.jpg", tags: ["new"] },
  { id: "converse-chuck-hi-navy", brand: "converse", name: "Chuck Taylor All Star High", colour: "Navy", category: "Sneakers", kind: "Canvas", price: 80, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Converse_All_Star_Blue_High_%284649851894%29.jpg/1280px-Converse_All_Star_Blue_High_%284649851894%29.jpg", credit: "Magnus D from London, United Kingdom, CC BY 2.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Converse_All_Star_Blue_High_(4649851894).jpg", tags: ["gift"] },
  { id: "converse-chuck-low-red", brand: "converse", name: "Chuck Taylor All Star Low", colour: "Red", category: "Sneakers", kind: "Canvas", price: 75, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Converse_All_Star_low_top_red.jpg/1280px-Converse_All_Star_low_top_red.jpg", credit: "Rachmaninoff, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Converse_All_Star_low_top_red.jpg", tags: ["gift"] },
  { id: "adidas-handball-spezial", brand: "adidas", name: "Handball Spezial", colour: "Core Black / Gum", category: "Sneakers", kind: "Terrace", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Adidas_Handball_Spezial.jpg/1280px-Adidas_Handball_Spezial.jpg", credit: "LeDroider, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Adidas_Handball_Spezial.jpg", tags: ["trending"], story: "sneaker-drops-late-september-2026" },
  { id: "adidas-stan-smith", brand: "adidas", name: "Stan Smith", colour: "White / Green", category: "Sneakers", kind: "Court", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/0/03/Stan_Smith_white_and_green.png", credit: "Raizin, CC BY-SA 3.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Stan_Smith_white_and_green.png", tags: ["gift"] },
  { id: "jordan-4-retro-grey", brand: "jordan", name: "Air Jordan 4 Retro", colour: "White / Grey / Black", category: "Sneakers", kind: "Basketball", price: 210, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Nike_Air_Jordan_IV.jpg/1280px-Nike_Air_Jordan_IV.jpg", credit: "Osyffar, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Nike_Air_Jordan_IV.jpg", tags: ["trending","drops"], story: "sneaker-drops-late-september-2026" },
  { id: "jordan-4-retro-sage", brand: "jordan", name: "Air Jordan 4 Retro", colour: "White / Sage", category: "Sneakers", kind: "Basketball", price: 210, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/2023_Buty_Nike_Air_Jordan.jpg/1280px-2023_Buty_Nike_Air_Jordan.jpg", credit: "Jacek Halicki, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:2023_Buty_Nike_Air_Jordan.jpg", tags: ["new","drops"] },
  { id: "jordan-1-high-og-silver", brand: "jordan", name: "Air Jordan 1 Retro High OG", colour: "Silver", category: "Sneakers", kind: "Basketball", price: 180, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Air_Jordan_1_Retro_High_OG_CO._Japan_silver.jpg/1280px-Air_Jordan_1_Retro_High_OG_CO._Japan_silver.jpg", credit: "HI 622, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Air_Jordan_1_Retro_High_OG_CO._Japan_silver.jpg", tags: ["drops"] },
  { id: "nike-cortez-classic", brand: "nike", name: "Cortez", colour: "White / Varsity Red / Blue", category: "Sneakers", kind: "Running", price: 100, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Nike_Cortez.jpg/1280px-Nike_Cortez.jpg", credit: "LeDroider, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Nike_Cortez.jpg", tags: ["gift"] },
  { id: "nike-air-max-plus-black", brand: "nike", name: "Air Max Plus", colour: "Black", category: "Sneakers", kind: "Running", price: 190, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Nike_Air_Max_Plus_%28604133-050%29.jpg/1280px-Nike_Air_Max_Plus_%28604133-050%29.jpg", credit: "Bojan Cvetanović, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Nike_Air_Max_Plus_(604133-050).jpg", tags: ["trending"] },
  { id: "puma-suede-red", brand: "puma", name: "Suede Classic", colour: "Red / White", category: "Sneakers", kind: "Court", price: 85, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Puma_suede_red.jpg/1280px-Puma_suede_red.jpg", credit: "DavidIvar, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Puma_suede_red.jpg", tags: ["gift"] },
  { id: "puma-speedcat-og", brand: "puma", name: "Speedcat OG", colour: "Red / White", category: "Sneakers", kind: "Motorsport", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Puma_Speedcat.jpg/1280px-Puma_Speedcat.jpg", credit: "LeDroider, CC0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Puma_Speedcat.jpg", tags: ["trending","new"] },
  { id: "on-cloud-black", brand: "on", name: "Cloud", colour: "Black / White", category: "Sneakers", kind: "Running", price: 150, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/On_Cloud_Running_Shoes.jpg/1280px-On_Cloud_Running_Shoes.jpg", credit: "Aw1805, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:On_Cloud_Running_Shoes.jpg" },
  { id: "salomon-speedcross", brand: "salomon", name: "Speedcross", colour: "Assorted", category: "Sneakers", kind: "Trail", price: 140, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Salomon_trail_running_shoes_women_Speedcross.jpg/1280px-Salomon_trail_running_shoes_women_Speedcross.jpg", credit: "Jjanhone, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Salomon_trail_running_shoes_women_Speedcross.jpg", tags: ["new"] },
  { id: "crocs-classic-clog", brand: "crocs", name: "Classic Clog", colour: "Black", category: "Sneakers", kind: "Clogs & sandals", price: 50, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Crocs-synthetic-clogs.jpg/1280px-Crocs-synthetic-clogs.jpg", credit: "Skyeyemx, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Crocs-synthetic-clogs.jpg", tags: ["gift"] },
  { id: "birkenstock-arizona", brand: "birkenstock", name: "Arizona", colour: "Black", category: "Sneakers", kind: "Clogs & sandals", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Birkenstock_Arizona_ESD.jpg/1280px-Birkenstock_Arizona_ESD.jpg", credit: "Phiarc, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Birkenstock_Arizona_ESD.jpg" },
  { id: "dr-martens-1460", brand: "dr-martens", name: "1460 boot", colour: "Dark brown", category: "Sneakers", kind: "Boots", price: 200, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Pair_of_brown_Dr_Martens_1460_boots.jpg/1280px-Pair_of_brown_Dr_Martens_1460_boots.jpg", credit: "Nick-D, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Pair_of_brown_Dr_Martens_1460_boots.jpg", tags: ["trending"] },
  { id: "dr-martens-1461", brand: "dr-martens", name: "1461 shoe", colour: "Black", category: "Sneakers", kind: "Boots", price: 180, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Dr._Martens_shoes.jpeg/1280px-Dr._Martens_shoes.jpeg", credit: "Mishimishimishi, Public domain, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Dr._Martens_shoes.jpeg" },
  { id: "arcteryx-alpha-sv", brand: "arcteryx", name: "Alpha SV jacket", colour: "Orange", category: "Clothing", kind: "Jackets", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Arcteryx_AlphaSV_orange_jacket_men.jpg/1280px-Arcteryx_AlphaSV_orange_jacket_men.jpg", credit: "Jjanhone, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Arcteryx_AlphaSV_orange_jacket_men.jpg", tags: ["new"] },
  { id: "arcteryx-cerium-hoody", brand: "arcteryx", name: "Cerium Hoody", colour: "Blue", category: "Clothing", kind: "Jackets", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Arcteryx_blue_CeriumLT_Hoody_men.jpg/1280px-Arcteryx_blue_CeriumLT_Hoody_men.jpg", credit: "Jjanhone, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Arcteryx_blue_CeriumLT_Hoody_men.jpg" },
  { id: "carhartt-hooded-jacket", brand: "carhartt", name: "Hooded work jacket", colour: "Brown duck", category: "Clothing", kind: "Jackets", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Carhartt_Hooded_Jacket_%289808828856%29.jpg/1280px-Carhartt_Hooded_Jacket_%289808828856%29.jpg", credit: "Eli Duke from Portland, OR, USA, CC BY-SA 2.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Carhartt_Hooded_Jacket_(9808828856).jpg", tags: ["trending"] },
  { id: "carhartt-active-jacket", brand: "carhartt", name: "Active jacket", colour: "Black", category: "Clothing", kind: "Jackets", image: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Carhartt.jpg", credit: "weeniebunvintage on depop, real name Isaac Barbosa, CC BY 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Carhartt.jpg" },
  { id: "levis-trucker-jacket", brand: "levis", name: "Trucker Jacket", colour: "Light wash", category: "Clothing", kind: "Denim", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Denim_Jacket_%2851079649933%29.jpg/1280px-Denim_Jacket_%2851079649933%29.jpg", credit: "ajay_suresh, CC BY 2.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Denim_Jacket_(51079649933).jpg", tags: ["gift"] },
  { id: "levis-501-original", brand: "levis", name: "501 Original", colour: "Light wash", category: "Clothing", kind: "Denim", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Levi%27s_501.jpg/1280px-Levi%27s_501.jpg", credit: "Köttbulleledaren, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Levi%27s_501.jpg" },
  { id: "new-era-59fifty-dodgers", brand: "new-era", name: "59FIFTY Los Angeles Dodgers", colour: "Royal blue", category: "Accessories", kind: "Caps", price: 45, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/2025_World_Series_Champion_Los_Angeles_Dodgers_New_Era_59Fifty_caps_NEW_ERA_YOKOHAMA_2026%E5%B9%B41%E6%9C%8825%E6%97%A5%E3%81%AE%E6%A8%AA%E6%B5%9C_202601251514_IMG_4734.jpg/1280px-2025_World_Series_Champion_Los_Angeles_Dodgers_New_Era_59Fifty_caps_NEW_ERA_YOKOHAMA_2026%E5%B9%B41%E6%9C%8825%E6%97%A5%E3%81%AE%E6%A8%AA%E6%B5%9C_202601251514_IMG_4734.jpg", credit: "ウィ貴公子, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:2025_World_Series_Champion_Los_Angeles_Dodgers_New_Era_59Fifty_caps_NEW_ERA_YOKOHAMA_2026%E5%B9%B41%E6%9C%8825%E6%97%A5%E3%81%AE%E6%A8%AA%E6%B5%9C_202601251514_IMG_4734.jpg", tags: ["gift"] },
  { id: "new-era-59fifty-yankees", brand: "new-era", name: "59FIFTY New York Yankees", colour: "Black", category: "Accessories", kind: "Caps", price: 45, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/New_York_Yankees_Yankee_Stadium_1923-2008_NEW_ERA_YOKOHAMA_2026%E5%B9%B41%E6%9C%8825%E6%97%A5%E3%81%AE%E6%A8%AA%E6%B5%9C_202601251514_IMG_4735.jpg/1280px-New_York_Yankees_Yankee_Stadium_1923-2008_NEW_ERA_YOKOHAMA_2026%E5%B9%B41%E6%9C%8825%E6%97%A5%E3%81%AE%E6%A8%AA%E6%B5%9C_202601251514_IMG_4735.jpg", credit: "ウィ貴公子, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:New_York_Yankees_Yankee_Stadium_1923-2008_NEW_ERA_YOKOHAMA_2026%E5%B9%B41%E6%9C%8825%E6%97%A5%E3%81%AE%E6%A8%AA%E6%B5%9C_202601251514_IMG_4735.jpg", tags: ["gift","trending"] },
  { id: "casio-f-91w", brand: "casio", name: "F-91W", colour: "Black", category: "Accessories", kind: "Watches", price: 20, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Casio_F-91W_watch_%282023%29_%28front_closeup_-_time%29_%28minor_retouch%29.jpg/1280px-Casio_F-91W_watch_%282023%29_%28front_closeup_-_time%29_%28minor_retouch%29.jpg", credit: "Multicherry, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Casio_F-91W_watch_(2023)_(front_closeup_-_time)_(minor_retouch).jpg", tags: ["gift"] },
  { id: "g-shock-ga-100", brand: "casio", name: "G-Shock GA-100", colour: "Black / Red", category: "Accessories", kind: "Watches", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Casio_G-Shock_GA-100%2C_digital_and_analog_watch_%28from_2010%2C_photographed_in_2023%29.jpg/1280px-Casio_G-Shock_GA-100%2C_digital_and_analog_watch_%28from_2010%2C_photographed_in_2023%29.jpg", credit: "Pittigrilli, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Casio_G-Shock_GA-100,_digital_and_analog_watch_(from_2010,_photographed_in_2023).jpg" },
  { id: "g-shock-gw-m5610u", brand: "casio", name: "G-Shock GW-M5610U", colour: "Black", category: "Accessories", kind: "Watches", price: 160, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/CASIO_G-Shock_GW-M5610U.jpg/1280px-CASIO_G-Shock_GW-M5610U.jpg", credit: "Md. Rifat Hasan Jihan, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:CASIO_G-Shock_GW-M5610U.jpg", tags: ["new"] },
  { id: "ray-ban-clubmaster", brand: "ray-ban", name: "Browline sunglasses", colour: "Black / Gold, green lenses", category: "Accessories", kind: "Sunglasses", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/2023_Okulary_przeciws%C5%82oneczne_Ray-Ban_%282%29.jpg/1280px-2023_Okulary_przeciws%C5%82oneczne_Ray-Ban_%282%29.jpg", credit: "Jacek Halicki, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:2023_Okulary_przeciws%C5%82oneczne_Ray-Ban_(2).jpg" },
  { id: "ray-ban-aviator-shooter", brand: "ray-ban", name: "Aviator Shooter RB3139", colour: "Gold, G-15 lenses", category: "Accessories", kind: "Sunglasses", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Ray-Ban_Aviator_Shooter_RB3139-001_3N_%28G-15_lenses%29_Size_62_09_160_Lens_base_6.jpg/1280px-Ray-Ban_Aviator_Shooter_RB3139-001_3N_%28G-15_lenses%29_Size_62_09_160_Lens_base_6.jpg", credit: "Francis Flinch, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Ray-Ban_Aviator_Shooter_RB3139-001_3N_(G-15_lenses)_Size_62_09_160_Lens_base_6.jpg" },
  { id: "eastpak-backpack-black", brand: "eastpak", name: "Backpack", colour: "Black", category: "Accessories", kind: "Bags", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Eastpak_Sugarbush_backpack_black.jpg/1280px-Eastpak_Sugarbush_backpack_black.jpg", credit: "Ubcule, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Eastpak_Sugarbush_backpack_black.jpg", tags: ["gift"] },
  { id: "apple-airpods-max", brand: "apple", name: "AirPods Max", colour: "Space grey", category: "Tech & play", kind: "Headphones", price: 579, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Apple_airpods_max_3.jpg/1280px-Apple_airpods_max_3.jpg", credit: "Arne Müseler, CC BY-SA 3.0 de, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Apple_airpods_max_3.jpg", tags: ["gift"] },
  { id: "nintendo-switch-2", brand: "nintendo", name: "Nintendo Switch 2", colour: "Console with dock", category: "Tech & play", kind: "Consoles", price: 469.99, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Nintendo_Switch_2_in_Docking_Console.jpg/1280px-Nintendo_Switch_2_in_Docking_Console.jpg", credit: "Crisco 1492, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Nintendo_Switch_2_in_Docking_Console.jpg", tags: ["trending","gift"], story: "switch-2-calendar-september-direct" },
  { id: "nintendo-joy-con-2", brand: "nintendo", name: "Joy-Con 2 pair", colour: "Blue / Orange", category: "Tech & play", kind: "Controllers", price: 89.99, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Nintendo_Switch_2_Joy-Con_2_Blue_and_Orange.jpg/1280px-Nintendo_Switch_2_Joy-Con_2_Blue_and_Orange.jpg", credit: "Crisco 1492, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Nintendo_Switch_2_Joy-Con_2_Blue_and_Orange.jpg", story: "switch-2-calendar-september-direct" },
  { id: "playstation-dualsense", brand: "playstation", name: "DualSense wireless controller", colour: "White", category: "Tech & play", kind: "Controllers", price: 74.99, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Playstation_DualSense_Controller.png/1280px-Playstation_DualSense_Controller.png", credit: "Alex Cochrane, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Playstation_DualSense_Controller.png", tags: ["gift"], story: "gta-vi-countdown" },
  { id: "instax-mini-11", brand: "fujifilm", name: "Instax Mini 11", colour: "Sky blue", category: "Tech & play", kind: "Cameras", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/%D7%9E%D7%A6%D7%9C%D7%9E%D7%AA_%D7%90%D7%99%D7%A0%D7%A1%D7%98%D7%A7%D7%A1_%D7%9E%D7%99%D7%A0%D7%99_11_FUJIFILM_INSTAX_MINI-_%D7%91%D7%A6%D7%91%D7%A2_%D7%9B%D7%97%D7%95%D7%9C.jpg/1280px-%D7%9E%D7%A6%D7%9C%D7%9E%D7%AA_%D7%90%D7%99%D7%A0%D7%A1%D7%98%D7%A7%D7%A1_%D7%9E%D7%99%D7%A0%D7%99_11_FUJIFILM_INSTAX_MINI-_%D7%91%D7%A6%D7%91%D7%A2_%D7%9B%D7%97%D7%95%D7%9C.jpg", credit: "ORANIT DORON, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:%D7%9E%D7%A6%D7%9C%D7%9E%D7%AA_%D7%90%D7%99%D7%A0%D7%A1%D7%98%D7%A7%D7%A1_%D7%9E%D7%99%D7%A0%D7%99_11_FUJIFILM_INSTAX_MINI-_%D7%91%D7%A6%D7%91%D7%A2_%D7%9B%D7%97%D7%95%D7%9C.jpg", tags: ["gift"] },
  { id: "technics-sl-1200g", brand: "technics", name: "SL-1200G turntable", colour: "Silver", category: "Tech & play", kind: "Audio", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Technics_SL-1200G_turntable_and_Audio_Technica_AT33sa_cartridge_%2839794359865%29.jpg/1280px-Technics_SL-1200G_turntable_and_Audio_Technica_AT33sa_cartridge_%2839794359865%29.jpg", credit: "david falkner from Birmingham, England, CC BY 2.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Technics_SL-1200G_turntable_and_Audio_Technica_AT33sa_cartridge_(39794359865).jpg", story: "lcd-soundsystem-nyc-residency-100th-show" },
  { id: "wilson-nba-game-ball", brand: "wilson", name: "NBA indoor game ball", colour: "Orange", category: "Tech & play", kind: "Sport", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Wilson_NBA_Indoor_game_ball.jpg/1280px-Wilson_NBA_Indoor_game_ball.jpg", credit: "Jjanhone, CC BY-SA 4.0, via Wikimedia Commons", photoPage: "https://commons.wikimedia.org/wiki/File:Wilson_NBA_Indoor_game_ball.jpg", tags: ["gift","trending"], story: "nba-2026-27-opening-night" },
];

// The original four shops' edits, in the same shape
const KIND: Record<string, string> = { Footwear: "Sneakers", Clothing: "Clothing", Accessories: "Accessories" };
const fromShops: ShopProduct[] = SHOPS.flatMap((shop) =>
  shop.products.map((product, index) => ({
    id: `${shop.slug}-${product.name}-${product.detail}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    brand: product.name.startsWith("Air Jordan") && shop.slug === "nike" ? "jordan" : shop.slug,
    name: product.name,
    colour: product.detail,
    category: (KIND[product.category] ?? "Accessories") as ShopCategory,
    kind: product.category === "Footwear" ? (shop.slug === "stockx" ? "Resale" : "Classics") : product.category === "Clothing" ? "Basics" : "Bags",
    price: product.price,
    image: product.image.replace(/([?&])w=\d+/, "$1w=900"),
    credit: "Unsplash",
    url: product.url,
    ...(index < 2 ? { tags: ["trending"] as ShopTag[] } : {}),
  })),
);

export const PRODUCTS: (ShopProduct & { url?: string })[] = [...PRODUCTS_NEW, ...fromShops];
export const getProduct = (id: string) => PRODUCTS.find((product) => product.id === id);
export const brandOf = (product: ShopProduct) => getBrand(product.brand)!;
/** Where "Shop at …" goes: the retailer's own page or search for the product */
export const buyUrl = (product: ShopProduct & { url?: string }) => {
  if (product.url) return product.url;
  const brand = brandOf(product);
  return brand.search ? brand.search(`${product.name} ${product.colour.split(",")[0]}`) : brand.site;
};
export const productsOf = (brand: string) => PRODUCTS.filter((product) => product.brand === brand);
export const SNEAKER_DROPS = DROPS.filter((drop) => drop.kind === "Sneakers");

// The gift guide: price bands
export const GIFT_BANDS = [
  { id: "under-50", label: "Under €50", test: (price?: number) => price !== undefined && price < 50 },
  { id: "under-100", label: "Under €100", test: (price?: number) => price !== undefined && price >= 50 && price < 100 },
  { id: "under-200", label: "Under €200", test: (price?: number) => price !== undefined && price >= 100 && price < 200 },
  { id: "big", label: "The big gift", test: (price?: number) => price !== undefined && price >= 200 },
] as const;