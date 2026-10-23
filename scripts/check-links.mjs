// Finds broken links on the site: starts from the front page and the
// sitemap, follows every link to another OGCW page (as the server sends the
// page), and reports any that don't answer 200. With --external it also
// checks each outside link once (some sites refuse checkers, so those are
// listed as "check by hand", not as broken).
//
//   node scripts/check-links.mjs                 (the site running on localhost:5174)
//   node scripts/check-links.mjs https://ogcultureworld.com --external

const args = process.argv.slice(2);
const BASE = (args.find((arg) => /^https?:\/\//.test(arg)) ?? "http://localhost:5174").replace(/\/$/, "");
const EXTERNAL = args.includes("--external");
const LIMIT = 1500;

const seen = new Map(); // path -> status
const from = new Map(); // path -> a page linking to it
const external = new Map(); // url -> a page linking to it
const queue = ["/"];

const decode = (text) => text.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const hrefs = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((match) => decode(match[1]));

const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = new URL(match[1]).pathname;
  if (!queue.includes(path)) queue.push(path);
}

while (queue.length && seen.size < LIMIT) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  let status = 0;
  let html = "";
  try {
    const response = await fetch(`${BASE}${path}`, { headers: { accept: "text/html" }, redirect: "follow" });
    status = response.status;
    if (status === 200 && (response.headers.get("content-type") ?? "").includes("text/html")) html = await response.text();
  } catch {
    status = -1;
  }
  seen.set(path, status);
  for (const href of hrefs(html)) {
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#") || href.startsWith("javascript:")) continue;
    const url = new URL(href, `${BASE}${path}`);
    if (url.origin === new URL(BASE).origin) {
      const next = url.pathname.replace(/\/$/, "") || "/";
      if (/\.(png|jpe?g|webp|svg|ico|xml|txt|webmanifest|pdf)$/i.test(next)) continue;
      if (!seen.has(next) && !queue.includes(next)) {
        queue.push(next);
        from.set(next, path);
      }
    } else if (/^https?:$/.test(url.protocol) && !external.has(url.href)) {
      external.set(url.href, path);
    }
  }
}

const broken = [...seen].filter(([, status]) => status !== 200);
console.log(`${seen.size} OGCW pages checked on ${BASE}.`);
if (broken.length) {
  console.log(`\nBroken (${broken.length}):`);
  for (const [path, status] of broken) console.log(`  ${status}  ${path}   (linked from ${from.get(path) ?? "the sitemap"})`);
} else {
  console.log("No broken OGCW links.");
}

if (EXTERNAL) {
  const bad = [];
  const unsure = [];
  const list = [...external];
  for (let i = 0; i < list.length; i += 8) {
    await Promise.all(
      list.slice(i, i + 8).map(async ([url, page]) => {
        try {
          let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": "Mozilla/5.0 (OGCW link check)" } });
          if (response.status === 405 || response.status === 403) response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": "Mozilla/5.0 (OGCW link check)" } });
          if (response.status === 404 || response.status === 410) bad.push(`${response.status}  ${url}   (on ${page})`);
          else if (response.status >= 400) unsure.push(`${response.status}  ${url}   (on ${page})`);
        } catch {
          unsure.push(`no answer  ${url}   (on ${page})`);
        }
      }),
    );
  }
  console.log(`\n${external.size} outside links checked.`);
  if (bad.length) console.log(`Broken outside links (${bad.length}):\n  ${bad.join("\n  ")}`);
  if (unsure.length) console.log(`Check by hand (the site refused the checker or didn't answer) (${unsure.length}):\n  ${unsure.join("\n  ")}`);
}
process.exitCode = broken.length ? 1 : 0;
