import { RestoreIcon } from "@sanity/icons/Restore";
import { useState } from "react";
import { useClient, type DocumentActionComponent } from "sanity";
import { SANITY_API_VERSION } from "./env";
import { sectionOfKey } from "../lib/site-sections";
import { refreshSiteCache } from "../lib/sanity-stories";

// "Restore this version" on a Site history version: the site's texts and
// photos go back to how they were then (live for everyone in a few seconds).
// The Site edits are made to match it: edits made since are removed, and
// the ones it had come back, each in its part of the site. The restore is
// itself kept as a new version, so it can be undone.

type Item = { _key: string; _type: string; key?: string; value?: string; section?: string; usual?: string; alt?: string; url?: string; image?: unknown; page?: string; layout?: unknown; fit?: string; clear?: boolean };
type Snapshot = { at?: string; texts?: Item[]; images?: Item[]; layouts?: Item[] };

type EditDoc = { _id: string; _type: string; [field: string]: unknown };
const docId = (key: string) => `siteEdit-${key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120)}`;

export const RestoreVersionAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: SANITY_API_VERSION });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const version = (props.published ?? props.draft) as Snapshot | null;
  const when = version?.at ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(version.at)) : "this version";

  const restore = async () => {
    if (!version) return;
    setBusy(true);
    try {
      const me = await client.request<{ name?: string }>({ uri: "/users/me" }).catch(() => null);
      const by = me?.name ?? "OGCW admin";
      const now = new Date().toISOString();
      const texts = (version.texts ?? []).filter((item) => item.key);
      const images = (version.images ?? []).filter((item) => item.key);
      const layouts = (version.layouts ?? []).filter((item) => item.key && item.layout);
      const keep = new Set([...texts, ...images, ...layouts].map((item) => docId(item.key!)));
      // Today's edits: an older version may not say which picture a photo
      // replaces ("usual"), or how it fits; those come from the edit as it is now
      const existing = await client.fetch<{ _id: string; key?: string; usual?: string; page?: string; fit?: string; clear?: boolean }[]>(`*[_type == "siteEdit"] { _id, key, usual, page, fit, clear }`);
      const now_ = new Map(existing.filter((doc) => doc.key).map((doc) => [doc.key!, doc]));
      const tx = client.transaction();
      for (const { _id: id } of existing) if (!keep.has(id.replace(/^drafts\./, "")) || id.startsWith("drafts.")) tx.delete(id);
      for (const item of texts) {
        tx.createOrReplace({ _id: docId(item.key!), _type: "siteEdit", key: item.key, kind: "text", value: item.value ?? "", section: item.section ?? sectionOfKey(item.key!), ...(item.usual ? { usual: item.usual } : {}), updatedAt: now, updatedBy: by });
      }
      const fullImages: Item[] = images.map((item) => {
        const current = now_.get(item.key!);
        const usual = item.usual ?? current?.usual;
        const page = item.page ?? current?.page;
        const fit = item.fit ?? current?.fit;
        const clear = item.clear ?? current?.clear;
        return { ...item, ...(usual ? { usual } : {}), ...(page ? { page } : {}), ...(fit ? { fit } : {}), ...(clear ? { clear: true } : {}) };
      });
      for (const item of fullImages) {
        const doc: EditDoc = {
          _id: docId(item.key!), _type: "siteEdit", key: item.key, kind: "image", section: item.section ?? sectionOfKey(item.key!),
          ...(item.usual ? { usual: item.usual } : {}), ...(item.page ? { page: item.page } : {}), ...(item.fit ? { fit: item.fit } : {}), ...(item.clear ? { clear: true } : {}),
          ...(item.alt ? { alt: item.alt } : {}),
          ...(item.image ? { image: item.image } : { url: item.url }),
          updatedAt: now, updatedBy: by,
        };
        tx.createOrReplace(doc);
      }
      // Texts and photos moved on their pages
      for (const item of layouts) {
        const page = item.page ?? item.key!.split("|")[0] ?? "/";
        tx.createOrReplace({ _id: docId(item.key!), _type: "siteEdit", key: item.key, kind: "layout", page, section: item.section ?? sectionOfKey(item.key!), layout: item.layout, updatedAt: now, updatedBy: by });
      }
      tx.delete("siteContent");
      const clean = (items: Item[]) => items.map(({ _key, _type, ...rest }) => ({ _key, _type, ...rest }));
      tx.create({ _type: "siteSnapshot", at: now, by, summary: `Restored the version from ${when}`, texts: clean(texts), images: clean(fullImages), layouts: clean(layouts) });
      await tx.commit();
      // The site keeps its copy for a few seconds: forget it, so the restored texts and photos show at once
      await refreshSiteCache().catch(() => {});
      props.onComplete();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  return {
    label: busy ? "Restoring…" : "Restore this version",
    icon: RestoreIcon,
    tone: "primary",
    disabled: busy || !version,
    onHandle: () => setConfirm(true),
    dialog: confirm
      ? {
          type: "confirm",
          message: `Put the site’s texts and photos back to how they were on ${when}? It goes live for everyone within seconds, and you can restore any other version afterwards.`,
          onConfirm: () => void restore(),
          onCancel: () => setConfirm(false),
        }
      : null,
  };
};
