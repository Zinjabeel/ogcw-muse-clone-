import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- Security headers (22 Oct 2026)
// Every response says how browsers must treat it:
//  - Content-Security-Policy: only scripts OGCW sent with this page run. Each
//    page gets a fresh random "nonce" written onto its own <script> tags;
//    a script injected any other way (the usual way logins get stolen) is
//    refused. Pictures may come from anywhere (shop and news photos);
//    connections only to OGCW, its account service (Supabase), its CMS
//    (Sanity) and Cloudflare's "are you human" check.
//  - HSTS: HTTPS only, for a year. No framing (clickjacking). No guessing
//    file types. Only the site's address goes to other sites as referrer.
//  - Answers to the page's own server calls (accounts, saving) are never cached.
const SUPABASE = "dkzjgjerfaxtjyeixpqe.supabase.co";

function contentSecurityPolicy(nonce: string, https: boolean) {
  const directives = [
    "default-src 'self'",
    // Browsers that understand nonces ignore 'self', https: and 'unsafe-inline' here (older ones fall back to them)
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' https://challenges.cloudflare.com 'unsafe-inline' https:`,
    // Sanity's interface (the studio and the site editor) loads its own font from *.sanity.io
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.sanity.io",
    "font-src 'self' data: https://fonts.gstatic.com https://*.sanity.io",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src 'self' https://${SUPABASE} wss://${SUPABASE} https://*.sanity.io wss://*.sanity.io https://challenges.cloudflare.com${https ? "" : " ws: http://localhost:*"}`,
    "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

function newNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

async function withSecurityHeaders(request: Request, response: Response): Promise<Response> {
  const url = new URL(request.url);
  const https = (request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? url.protocol.replace(":", "")) === "https";
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (https) headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (url.pathname.startsWith("/_serverFn")) headers.set("Cache-Control", "no-store");

  if (!(headers.get("content-type") ?? "").includes("text/html") || !response.body) {
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  // The page's own scripts (and their preloads) carry this response's nonce
  const nonce = newNonce();
  const html = (await response.text())
    .replace(/<script\b(?![^>]*\snonce=)/gi, `<script nonce="${nonce}"`)
    .replace(/<link\b(?=[^>]*\brel="modulepreload")(?![^>]*\snonce=)/gi, `<link nonce="${nonce}"`);
  headers.set("Content-Security-Policy", contentSecurityPolicy(nonce, https));
  headers.delete("Content-Length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await withSecurityHeaders(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(request, new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      }));
    }
  },
};
