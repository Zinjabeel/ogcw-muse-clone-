import { createServerFn } from "@tanstack/react-start";
import { createClient, type SanityClient } from "@sanity/client";
import { z } from "zod";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { currentAccount } from "./auth";
import type { Mutation } from "./server/admin-sanity.server";

// Saving from the site editor and design notes (22 Oct 2026), two ways:
//  - logged in to the studio with GitHub on this browser: straight to Sanity
//    with that person's own studio login, as before;
//  - logged in with an OGCW admin account and its two-step code: through the
//    server (src/lib/server/admin-sanity.server.ts), which keeps the Sanity
//    key to itself and checks every change.
// Both look the same to the code that saves (AdminWriter).

const server = () => import("./server/admin-sanity.server");
const parse = <T extends z.ZodTypeAny>(schema: T) => (data: unknown): z.infer<T> => schema.parse(data);
const doc = z.record(z.unknown());
const mutation = z.union([
  z.object({ create: doc }),
  z.object({ createOrReplace: doc }),
  z.object({ delete: z.object({ id: z.string().max(200) }) }),
  z.object({ patch: z.object({ id: z.string().max(200), set: z.record(z.unknown()) }) }),
]);

const meFn = createServerFn({ method: "POST" }).handler(async () => (await server()).me());
const readFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ query: z.string().max(2000), params: z.record(z.unknown()).optional() })))
  .handler(async ({ data }) => (await server()).read(data));
const writeFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ mutations: z.array(mutation).min(1).max(500) })))
  .handler(async ({ data }) => (await server()).write({ mutations: data.mutations as Mutation[] }));
const pruneFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ cutoff: z.string().max(40) })))
  .handler(async ({ data }) => (await server()).prune(data));
const uploadFn = createServerFn({ method: "POST" })
  .validator(parse(z.object({ dataUrl: z.string().max(16_000_000), filename: z.string().max(200) })))
  .handler(async ({ data }) => (await server()).upload(data));

export type AdminTransaction = {
  create: (doc: Record<string, unknown>) => AdminTransaction;
  createOrReplace: (doc: Record<string, unknown> & { _id: string }) => AdminTransaction;
  delete: (id: string) => AdminTransaction;
  patch: (id: string, edit: (patch: { set: (fields: Record<string, unknown>) => unknown }) => unknown) => AdminTransaction;
  commit: () => Promise<unknown>;
};
export type AdminWriter = {
  /** Who is saving, for the history */
  me: () => Promise<string>;
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
  transaction: () => AdminTransaction;
  createOrReplace: (doc: Record<string, unknown> & { _id: string }) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
  /** Site history versions older than the cut-off go */
  pruneHistory: (cutoff: string) => Promise<unknown>;
  upload: (file: Blob, filename: string) => Promise<{ _id: string; url: string }>;
};

function collect(send: (mutations: Mutation[]) => Promise<unknown>): AdminTransaction {
  const mutations: Mutation[] = [];
  const tx: AdminTransaction = {
    create: (doc) => (mutations.push({ create: doc }), tx),
    createOrReplace: (doc) => (mutations.push({ createOrReplace: doc }), tx),
    delete: (id) => (mutations.push({ delete: { id } }), tx),
    patch: (id, edit) => {
      const set: Record<string, unknown> = {};
      edit({ set: (fields) => Object.assign(set, fields) });
      mutations.push({ patch: { id, set } });
      return tx;
    },
    commit: () => (mutations.length ? send(mutations) : Promise.resolve()),
  };
  return tx;
}

/** Straight to Sanity, with the studio login of the person on this browser */
function direct(client: SanityClient): AdminWriter {
  return {
    me: async () => {
      const me = await client.request<{ name?: string; email?: string }>({ uri: "/users/me" }).catch(() => null);
      return me?.name || me?.email || "OGCW admin";
    },
    fetch: (query, params) => client.fetch(query, params ?? {}),
    transaction: () => collect((mutations) => client.mutate(mutations as Parameters<SanityClient["mutate"]>[0])),
    createOrReplace: (doc) => client.createOrReplace(doc as { _id: string; _type: string }),
    delete: (id) => client.delete(id),
    pruneHistory: (cutoff) => client.delete({ query: `*[_type == "siteSnapshot" && at < $cutoff]`, params: { cutoff } }),
    upload: async (file, filename) => {
      const asset = await client.assets.upload("image", file, { filename });
      return { _id: asset._id, url: asset.url };
    },
  };
}

const asDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("The photo couldn’t be read."));
    reader.readAsDataURL(file);
  });

/** Through the server, for an admin logged in with their OGCW account */
const throughServer: AdminWriter = {
  me: () => meFn(),
  fetch: async <T,>(query: string, params?: Record<string, unknown>) => JSON.parse(await readFn({ data: { query, ...(params ? { params } : {}) } })) as T,
  transaction: () => collect((mutations) => writeFn({ data: { mutations } })),
  createOrReplace: (doc) => writeFn({ data: { mutations: [{ createOrReplace: doc }] } }),
  delete: (id) => writeFn({ data: { mutations: [{ delete: { id } }] } }),
  pruneHistory: (cutoff) => pruneFn({ data: { cutoff } }),
  upload: async (file, filename) => uploadFn({ data: { dataUrl: await asDataUrl(file), filename } }),
};

const STUDIO_TOKEN_KEY = `__studio_auth_token_${SANITY_PROJECT_ID}`;
/** The studio login (GitHub, through Sanity) on this browser, if any */
export function studioToken(): string | null {
  try {
    return (JSON.parse(localStorage.getItem(STUDIO_TOKEN_KEY) ?? "null") as { token?: string } | null)?.token ?? null;
  } catch {
    return null;
  }
}

/** Saving as the admin on this browser, or null when nobody here may */
export function adminClient(): AdminWriter | null {
  const token = studioToken();
  if (token) return direct(createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, token, useCdn: false }));
  return currentAccount().admin ? throughServer : null;
}
