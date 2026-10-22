import { createClient, type SanityClient } from "@sanity/client";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { accountState, openSession } from "./session.server";
import { setting } from "./settings.server";

// Saving the site editor's changes for an admin who logged in with their
// OGCW account (22 Oct 2026). The Sanity key stays on the server: the
// browser only sends what to change, and the server checks it's an admin
// with their two-step code given, and that each change is one the site
// editor makes (a site text or photo, a history version, a story's
// headline, label or summary, a design note), before saving it.

export type Mutation =
  | { create: Record<string, unknown> }
  | { createOrReplace: Record<string, unknown> }
  | { delete: { id: string } }
  | { patch: { id: string; set: Record<string, unknown> } };

const STORY_FIELDS: Record<string, number> = { title: 140, deck: 240, kicker: 40 };
const SITE_EDIT = /^siteEdit-[A-Za-z0-9_-]{1,120}$/;
const DESIGN_NOTE = /^designnotes\.[A-Za-z0-9_-]{1,100}$/;

// Made again whenever the server's Sanity key changes
let client: { token: string; sanity: SanityClient } | null = null;
async function sanity(): Promise<SanityClient | null> {
  const token = await setting("SANITY_EDITOR_TOKEN");
  if (!token) return null;
  if (client?.token !== token) client = { token, sanity: createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, token, useCdn: false }) };
  return client.sanity;
}

/** The admin on this request, or null */
export async function admin(): Promise<{ name: string } | null> {
  const open = await openSession();
  if (!open) return null;
  const account = await accountState(open.session);
  return account.admin && account.user ? { name: account.user.name || account.user.email } : null;
}

async function ready() {
  const who = await admin();
  if (!who) throw new Error("Only an OGCW admin, logged in with their two-step code, can do that.");
  const store = await sanity();
  if (!store) throw new Error("Saving isn’t set up on this server yet (SANITY_EDITOR_TOKEN).");
  return { who, store };
}

export async function me() {
  return (await ready()).who.name;
}

/** A query's answer, as JSON (any shape can travel back that way) */
export async function read(input: { query: string; params?: Record<string, unknown> | undefined }): Promise<string> {
  const { store } = await ready();
  return JSON.stringify((await store.fetch(input.query, input.params ?? {})) ?? null);
}

async function allowed(store: SanityClient, mutation: Mutation): Promise<boolean> {
  if ("create" in mutation) return mutation.create["_type"] === "siteSnapshot" && mutation.create["_id"] === undefined;
  if ("createOrReplace" in mutation) {
    const doc = mutation.createOrReplace;
    const id = String(doc["_id"] ?? "");
    return (doc["_type"] === "siteEdit" && SITE_EDIT.test(id)) || (doc["_type"] === "designNote" && DESIGN_NOTE.test(id));
  }
  if ("delete" in mutation) return mutation.delete.id === "siteContent" || SITE_EDIT.test(mutation.delete.id) || DESIGN_NOTE.test(mutation.delete.id);
  const { id, set } = mutation.patch;
  const fields = Object.entries(set);
  if (!fields.length || !fields.every(([field, value]) => field in STORY_FIELDS && typeof value === "string" && value.length <= STORY_FIELDS[field]!)) return false;
  return (await store.fetch<number>(`count(*[_id == $id && _type == "story"])`, { id })) === 1;
}

export async function write(input: { mutations: Mutation[] }) {
  const { store } = await ready();
  for (const mutation of input.mutations) {
    if (!(await allowed(store, mutation))) throw new Error("That change isn’t one the site editor makes, so it wasn’t saved.");
  }
  await store.mutate(input.mutations as Parameters<SanityClient["mutate"]>[0], { visibility: "sync" });
  return { ok: true as const };
}

/** Site history versions older than the cut-off go */
export async function prune(input: { cutoff: string }) {
  const { store } = await ready();
  await store.delete({ query: `*[_type == "siteSnapshot" && at < $cutoff]`, params: { cutoff: input.cutoff } });
  return { ok: true as const };
}

/** A photo for the site, sent as a data: address */
export async function upload(input: { dataUrl: string; filename: string }) {
  const { store } = await ready();
  const match = input.dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("That isn’t a picture.");
  const bytes = Uint8Array.from(atob(match[2]!), (char) => char.charCodeAt(0));
  const asset = await store.assets.upload("image", new Blob([bytes], { type: match[1]! }), { filename: input.filename.replace(/[^\w.-]+/g, "-").slice(0, 120) || "photo.jpg" });
  return { _id: asset._id, url: asset.url };
}
