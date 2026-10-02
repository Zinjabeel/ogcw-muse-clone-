import { RestoreIcon } from "@sanity/icons/Restore";
import { useState } from "react";
import { useClient, type DocumentActionComponent } from "sanity";
import { SANITY_API_VERSION } from "./env";

// "Restore this version" on a Site history version: the site's texts and
// photos go back to how they were then (live for everyone in a few seconds),
// and the restore is itself kept as a new version, so it can be undone.

type Item = { _key: string; _type: string; [field: string]: unknown };
type Snapshot = { at?: string; texts?: Item[]; images?: Item[] };

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
      const clean = (items: Item[] | undefined) => (items ?? []).map(({ _key, _type, ...rest }) => ({ _key, _type, ...rest }));
      await client
        .transaction()
        .createIfNotExists({ _id: "siteContent", _type: "siteContent" })
        .patch("siteContent", (patch) => patch.set({ texts: clean(version.texts), images: clean(version.images), updatedBy: me?.name ?? "OGCW admin" }))
        .create({ _type: "siteSnapshot", at: new Date().toISOString(), by: me?.name ?? "OGCW admin", summary: `Restored the version from ${when}`, texts: clean(version.texts), images: clean(version.images) })
        .commit();
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
