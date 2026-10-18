// npm run check [-- http://localhost:5174]
//
// The quick check after every change (from the site review, owner, 18 Oct
// 2026): opens the main pages in a real browser (Chrome or Edge, headless)
// and reports anything broken: a page that doesn't answer 200, a page that
// shows the "didn't load" screen or has no main content, and any error the
// page writes to the console. The sitemap, RSS feed and robots.txt are
// checked too, and so is the newest story. No extra packages: it talks to
// the browser over its own debugging connection.
//
// Exit code 0 = all fine, 1 = something to look at (each problem is listed).

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] ?? process.env.CHECK_URL ?? "http://localhost:5174").replace(/\/$/, "");
const PAGES = ["/", "/news", "/music", "/games", "/streaming", "/culture", "/sports", "/originals", "/explore", "/trends", "/forum", "/about", "/info/newsletter", "/info/privacy", "/info/faq"];
const FILES = [
  { path: "/sitemap.xml", type: "xml", has: "<urlset" },
  { path: "/rss.xml", type: "rss", has: "<rss" },
  { path: "/robots.txt", type: "text/plain", has: "Sitemap:" },
];
// Errors that come from outside the site (blocked trackers in a headless browser, extensions)
const IGNORE = [/favicon/i, /ERR_BLOCKED_BY_CLIENT/];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const problems = [];
const fail = (where, what) => problems.push(`${where}: ${what}`);

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env["ProgramFiles(x86)"] && join(process.env["ProgramFiles(x86)"], "Microsoft/Edge/Application/msedge.exe"),
    process.env.ProgramFiles && join(process.env.ProgramFiles, "Google/Chrome/Application/chrome.exe"),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((path) => path && existsSync(path));
}

// 1. The files for search engines and feed readers
for (const file of FILES) {
  try {
    const response = await fetch(BASE + file.path);
    const text = await response.text();
    if (response.status !== 200) fail(file.path, `answered ${response.status}`);
    else if (!(response.headers.get("content-type") ?? "").includes(file.type)) fail(file.path, `wrong type ${response.headers.get("content-type")}`);
    else if (!text.includes(file.has)) fail(file.path, `doesn't contain ${file.has}`);
  } catch (error) {
    fail(file.path, `no answer (${error.message}). Is the site running at ${BASE}?`);
  }
}

// The newest story, from the sitemap
try {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const story = sitemap.match(/<loc>[^<]*?(\/news\/[a-z0-9-]+)<\/loc>/)?.[1];
  if (story) PAGES.push(story);
  else fail("/sitemap.xml", "lists no stories");
} catch { /* reported above */ }

// 2. Every page in a real browser
const browserPath = findBrowser();
if (!browserPath) {
  fail("browser", "no Chrome or Edge found (set CHROME_PATH to one)");
} else {
  const profile = mkdtempSync(join(tmpdir(), "ogcw-check-"));
  const port = 9400 + Math.floor(Math.random() * 400);
  const browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch { /* not up yet */ }
    }
    if (!target) throw new Error("the browser didn't start");
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve); socket.addEventListener("error", reject); });
    let id = 0;
    const waiting = new Map();
    let errors = [];
    let status = 0;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id); }
      if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
      if (message.method === "Network.responseReceived" && message.params.type === "Document") status = message.params.response.status;
    });
    const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; waiting.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params })); });
    const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    for (const page of PAGES) {
      errors = [];
      status = 0;
      await send("Page.navigate", { url: BASE + page });
      await sleep(5000);
      const state = await evaluate(`({ main: !!document.querySelector("main"), broken: document.body.innerText.includes("This page didn’t load"), notFound: !!document.querySelector(".nf, [data-not-found]") || /404/.test(document.title) })`);
      if (status && status !== 200) fail(page, `answered ${status}`);
      if (!state?.main) fail(page, "has no main content");
      if (state?.broken) fail(page, "shows the \"This page didn’t load\" screen");
      if (state?.notFound) fail(page, "shows the 404 page");
      for (const error of errors.filter((text) => !IGNORE.some((pattern) => pattern.test(text)))) fail(page, `console error: ${String(error).slice(0, 300)}`);
      process.stdout.write(".");
    }
    process.stdout.write("\n");
    socket.close();
  } catch (error) {
    fail("browser", error.message);
  } finally {
    browser.kill();
    await sleep(500);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still hold it */ }
  }
}

if (problems.length) {
  console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"} on ${BASE}:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`All ${PAGES.length} pages and ${FILES.length} files are fine on ${BASE}.`);
