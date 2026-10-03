// Replace a story's lead photo with a Wikimedia Commons file.
// SLUG=… FILE="<Commons file name>" ALT=… CREDIT=… [POS="50% 30%"] npx sanity exec scripts/swap-photo.mjs --with-user-token
import { getCliClient } from "sanity/cli";

const { SLUG: slug, FILE: file, ALT: alt, CREDIT: credit, POS: position } = process.env;
if (!slug || !file || !alt || !credit) throw new Error("Set SLUG, FILE, ALT and CREDIT (and POS if needed)");
const client = getCliClient({ apiVersion: "2024-01-01" });

const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`;
const response = await fetch(url, { headers: { "User-Agent": "OGCW/1.0 (business@ogcultureworld.com)" } });
if (!response.ok) throw new Error(`Couldn't download ${file}: ${response.status}`);
const asset = await client.assets.upload("image", Buffer.from(await response.arrayBuffer()), { filename: file });

const ids = await client.fetch(`*[_type == "story" && slug.current == $slug]._id`, { slug });
const photo = { _type: "photo", alt, credit, image: { _type: "image", asset: { _type: "reference", _ref: asset._id } }, ...(position ? { position } : {}) };
const tx = client.transaction();
for (const id of ids) tx.patch(id, (patch) => patch.set({ photo }));
await tx.commit();
console.log(`${slug}: new photo on ${ids.join(", ")}`);
