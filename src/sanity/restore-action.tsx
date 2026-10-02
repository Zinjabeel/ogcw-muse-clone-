import { RestoreIcon } from "@sanity/icons/Restore";
import { useState } from "react";
import { useClient, type DocumentActionComponent } from "sanity";
import { SANITY_API_VERSION } from "./env";
import { sectionOfKey } from "../lib/site-sections";

// "Restore this version" on a Site history version: the site's texts and
// photos go back to how they were then (live for everyone in a few seconds).
// The Site edits are made to match it: edits made since are removed, and
// the ones it had come back, each in its part of the site. The restore is
// itself kept as a new version, so it can be undone.

type Item = { _key: string; _type: string; key?: string; value?: string; section?: string; usual?: string; alt?: string; url?: string; image?: unknown };
type Snapshot = { at?: string; texts?: Item[]; images?: Item[] };

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
      const keep = new Set([...texts, ...images].map((item) => docId(item.key!)));
      const existing = await client.fetch<string[]>(`*[_type == "siteEdit"]._id`);
      const tx = client.transaction();
      for (const id of existing) if (!keep.has(id.replace(/^drafts\./, "")) || id.startsWith("drafts.")) tx.delete(id);
      for (const item of texts) {
        tx.createOrReplace({ _id: docId(item.key!), _type: "siteEdit", key: item.key, kind: "text", value: item.value ?? "", section: item.section ?? sectionOfKey(item.key!), ...(item.usual ? { usual: item.usual } : {}), updatedAt: now, updatedBy: by });
      }
      for (const item of images) {
        const doc: EditDoc = { _id: docId(item.key!), _type: "siteEdit", key: item.key, kind: "image", section: item.section ?? sectionOfKey(item.key!), ...(item.alt ? { alt: item.alt } : {}), ...(item.image ? { image: item.image } : { url: item.url }), updatedAt: now, updatedBy: by };
        tx.createOrReplace(doc);
      }
      tx.delete("siteContent");
      const clean = (items: Item[]) => items.map(({ _key, _type, ...rest }) => ({ _key, _type, ...rest }));
      tx.create({ _type: "siteSnapshot", at: now, by, summary: `Restored the version from ${when}`, texts: clean(texts), images: clean(images) });
      await tx.commit();
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
