import { Badge, Box, Button, Card, Checkbox, Dialog, Flex, Spinner, Stack, Switch, Text } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { ArrowUpIcon } from "@sanity/icons/ArrowUp";
import { TransferIcon } from "@sanity/icons/Transfer";
import { LayoutTemplate } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { resolveSlots, SLOTS, type FrontLayout, type SlotDef, type SlotId } from "@/data/placements";
import { byDate, toPhoto, type SanityPhoto } from "@/lib/sanity-mapping";
import { SANITY_API_VERSION } from "./env";

// "Where it appears": the button in the story editor's bar and the box it
// opens, listing every spot on the front page (src/data/placements.ts) with
// the stories in it now. Tick a spot to put this story there; when the spot
// is full, it takes the place of the last story, or of the one you swap it
// with. The story it replaced waits behind it, and comes back if this one
// leaves. "News page only" takes the story off the front page altogether.
//
// The choices are kept in Sanity's Front page document ("frontPage") and go
// live straight away. A story that isn't published yet keeps its places
// until it is: the site skips it, and shows what was there before.

const FRONT_ID = "frontPage";
const QUERY = `{
  "front": *[_id == "frontPage"][0] { "slots": slots[] { "id": slot, "refs": stories[]._ref }, "hidden": hidden[]._ref },
  "stories": *[_type == "story" && defined(slug.current) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] { _id, "slug": slug.current, title, date, photo }
}`;

type RawStory = { _id: string; slug: string; title?: string; date?: string; photo?: SanityPhoto };
type Raw = { front: { slots?: { id?: string; refs?: (string | null)[] }[] | null; hidden?: (string | null)[] | null } | null; stories: RawStory[] };
type Item = { id: string; slug: string; title: string; date: string; photo: SanityPhoto | undefined; published: boolean };
/** The story being edited: its published id, and what it looks like now */
export type ThisStory = { id: string; slug: string; title: string; date: string; photo: SanityPhoto | undefined };

const AREAS = [...new Set(SLOTS.map((slot) => slot.area))];
const key = () => Math.random().toString(36).slice(2, 12);
const thumb = (photo: SanityPhoto | undefined) => toPhoto(photo, 160)?.src;

/** The front page as it is now, and a way to change it */
function useFrontPage(story: ThisStory) {
  const client = useClient({ apiVersion: SANITY_API_VERSION });
  const [raw, setRaw] = useState<Raw | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setRaw(await client.fetch<Raw>(QUERY));
      setError("");
    } catch {
      setError("The front page didn’t load. Check your connection and try again.");
    }
  }, [client]);
  useEffect(() => { void load(); }, [load]);

  return useMemo(() => {
    if (!raw) return { ready: false as const, error, load };
    // Every published story, and this one even before it's published
    const items: Item[] = raw.stories.map((doc) => ({ id: doc._id, slug: doc.slug, title: doc.title ?? doc.slug, date: doc.date ?? "", photo: doc.photo, published: true }));
    const published = items.some((item) => item.id === story.id);
    const all = published ? items : [...items, { ...story, published: false }];
    all.sort(byDate);
    const slugOf = new Map(all.map((item) => [item.id, item.slug]));
    const idOf = new Map(all.map((item) => [item.slug, item.id]));
    const toSlugs = (refs: (string | null)[] | null | undefined) => (refs ?? []).flatMap((ref) => (ref && slugOf.has(ref) ? [slugOf.get(ref)!] : []));
    const layout: FrontLayout = {
      slots: Object.fromEntries((raw.front?.slots ?? []).flatMap((slot) => (slot.id ? [[slot.id, toSlugs(slot.refs)]] : []))),
      hidden: toSlugs(raw.front?.hidden),
    };
    // What the site shows; an unpublished story only where it's placed by hand
    const view = (next: FrontLayout) => resolveSlots(all, published ? next : { ...next, hidden: [...next.hidden, story.slug] });
    return { ready: true as const, error, load, all, idOf, layout, view, shown: view(layout), published };
  }, [raw, error, load, story]);
}

/** The button in the story editor's bar, and the box it opens */
export function PlacesButton({ story, disabled }: { story: ThisStory; disabled: boolean }) {
  const front = useFrontPage(story);
  const [open, setOpen] = useState(false);
  const places = front.ready ? SLOTS.filter((slot) => front.shown[slot.id].some((item) => item.slug === story.slug)).length : 0;
  const hidden = front.ready && front.layout.hidden.includes(story.slug);
  const label = !front.ready ? "Where it appears" : places ? `On the front page: ${places} ${places === 1 ? "place" : "places"}` : hidden ? "News page only" : "News page + More news";

  return (
    <>
      <button type="button" className="se-places" disabled={disabled || !story.slug} title={story.slug ? undefined : "Give the story a web address first"} onClick={() => { setOpen(true); void front.load(); }}>
        <LayoutTemplate size={15} aria-hidden="true" /> {label}
      </button>
      {open && <PlacesDialog story={story} front={front} onClose={() => setOpen(false)} />}
    </>
  );
}

function PlacesDialog({ story, front, onClose }: { story: ThisStory; front: ReturnType<typeof useFrontPage>; onClose: () => void }) {
  const client = useClient({ apiVersion: SANITY_API_VERSION });
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  if (!front.ready) {
    return (
      <Dialog id="ogcw-places" header="Where this story appears" onClose={onClose} width={1}>
        <Box padding={5}>
          {front.error ? <Text size={1}>{front.error}</Text> : <Flex justify="center"><Spinner muted /></Flex>}
        </Box>
      </Dialog>
    );
  }
  const { layout, shown, view, idOf, published } = front;
  const isThis = (item: { slug: string }) => item.slug === story.slug;
  const hidden = layout.hidden.includes(story.slug);

  // Save spots (each as the full list of stories it shows, in order) and the News-page-only list
  const save = async (task: string, slots: Partial<Record<SlotId, string[]>>, nextHidden: string[] | undefined, message: string) => {
    setBusy(task);
    const refs = (slugs: string[]) => slugs.flatMap((slug) => {
      const id = idOf.get(slug);
      return id ? [{ _key: key(), _type: "reference", _ref: id, _weak: true }] : [];
    });
    try {
      const tx = client.transaction().createIfNotExists({ _id: FRONT_ID, _type: "frontPage" });
      for (const [id, slugs] of Object.entries(slots)) {
        tx.patch(FRONT_ID, (patch) => patch.setIfMissing({ slots: [] }).unset([`slots[_key=="${id}"]`]));
        tx.patch(FRONT_ID, (patch) => patch.append("slots", [{ _key: id, _type: "slot", slot: id, stories: refs(slugs) }]));
      }
      if (nextHidden) tx.patch(FRONT_ID, (patch) => patch.set({ hidden: refs(nextHidden) }));
      await tx.commit();
      await front.load();
      toast.push({ status: "success", title: message, ...(published ? {} : { description: "It shows there as soon as you publish the story." }) });
    } catch {
      toast.push({ status: "error", title: "That didn’t save. Try again." });
    } finally {
      setBusy(null);
    }
  };

  const slugsOf = (items: { slug: string }[]) => items.map((item) => item.slug);
  // The spot without this story: the next ones in line move up
  const without = (slot: SlotDef) => {
    const placed = (layout.slots[slot.id as SlotId] ?? []).filter((slug) => slug !== story.slug);
    return slugsOf(view({ slots: { ...layout.slots, [slot.id]: placed }, hidden: [...layout.hidden, story.slug] })[slot.id as SlotId]);
  };
  // Put this story in a spot, in place of `out` (or added, if there's room); `out` waits behind it
  const put = (slot: SlotDef, out: string | undefined) => {
    const now = slugsOf(shown[slot.id as SlotId]);
    const next = out ? now.map((slug) => (slug === out ? story.slug : slug)) : [...now, story.slug];
    const behind = (layout.slots[slot.id as SlotId] ?? []).filter((slug) => !next.includes(slug));
    const list = [...next, ...(out ? [out] : []), ...behind].filter((slug, index, all) => all.indexOf(slug) === index).slice(0, slot.max * 2);
    const outTitle = out ? front.all.find((item) => item.slug === out)?.title : undefined;
    void save(slot.id, { [slot.id]: list }, layout.hidden.filter((slug) => slug !== story.slug), outTitle ? `In “${slot.name}”, in place of “${outTitle}”` : `Added to “${slot.name}”`);
  };
  const toggle = (slot: SlotDef, on: boolean) => {
    const now = shown[slot.id as SlotId];
    if (on) put(slot, now.length >= slot.max ? now[now.length - 1]?.slug : undefined);
    else void save(slot.id, { [slot.id]: without(slot) }, undefined, `Taken out of “${slot.name}”`);
  };
  const moveFirst = (slot: SlotDef) => {
    const now = slugsOf(shown[slot.id as SlotId]);
    const behind = (layout.slots[slot.id as SlotId] ?? []).filter((slug) => !now.includes(slug));
    void save(slot.id, { [slot.id]: [story.slug, ...now.filter((slug) => slug !== story.slug), ...behind] }, undefined, `First in “${slot.name}”`);
  };
  // Off the front page: out of every spot, and out of the automatic ones
  const newsPageOnly = () => {
    const slots = Object.fromEntries(SLOTS.filter((slot) => shown[slot.id].some(isThis)).map((slot) => [slot.id, without(slot)]));
    void save("hide", slots, [...new Set([...layout.hidden, story.slug])], "News page only: off the front page");
  };

  const places = SLOTS.filter((slot) => shown[slot.id].some(isThis)).length;

  return (
    <Dialog
      id="ogcw-places"
      header="Where this story appears"
      onClose={onClose}
      width={2}
      footer={
        <Flex padding={3} gap={2} justify="space-between" align="center">
          <Button mode="ghost" tone="caution" text="News page only" disabled={!!busy || (hidden && !places)} loading={busy === "hide"} onClick={newsPageOnly} />
          <Button tone="primary" text="Done" onClick={onClose} />
        </Flex>
      }
    >
      <Box padding={4}>
        <Stack gap={5}>
          <Card padding={3} radius={2} tone="positive" border>
            <Text size={1}>Always on the <strong>News page</strong> and on its <strong>own page</strong>. Tick any spot below to show it on the front page too.{published ? " Changes go live straight away." : " It shows there once you publish it."}</Text>
          </Card>

          {AREAS.map((area) => (
            <Stack key={area} gap={3}>
              <Text size={1} weight="semibold" muted style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>{area}</Text>
              {SLOTS.filter((slot) => slot.area === area).map((slot) => {
                const now = shown[slot.id];
                const here = now.some(isThis);
                return (
                  <Card key={slot.id} padding={3} radius={2} border tone={here ? "primary" : "default"}>
                    <Flex gap={3} align="flex-start">
                      <Box paddingTop={1}>
                        <Checkbox id={`place-${slot.id}`} checked={here} disabled={!!busy} onChange={(event) => toggle(slot, event.currentTarget.checked)} />
                      </Box>
                      <Stack gap={3} flex={1}>
                        <Flex gap={2} align="center" wrap="wrap">
                          <Text as="label" htmlFor={`place-${slot.id}`} weight="semibold" size={1}>{slot.name}</Text>
                          <Text size={1} muted>{slot.note} · {slot.max} {slot.max === 1 ? "spot" : "spots"}</Text>
                          {busy === slot.id && <Spinner muted />}
                        </Flex>
                        <Flex gap={2} wrap="wrap">
                          {now.map((item, index) => (
                            <Card key={item.slug} padding={1} radius={2} border tone={isThis(item) ? "primary" : "transparent"} style={{ width: 228 }}>
                              <Flex gap={2} align="center">
                                <Box style={{ flex: "none", width: 44, height: 30, borderRadius: 3, overflow: "hidden", background: "var(--card-border-color)" }}>
                                  {thumb(item.photo) && <img src={thumb(item.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                                </Box>
                                <Stack gap={1} flex={1} style={{ minWidth: 0 }}>
                                  <Text size={0} textOverflow="ellipsis" weight={isThis(item) ? "semibold" : "regular"}>{index + 1}. {item.title}</Text>
                                  {isThis(item) && <Box><Badge tone="primary" fontSize={0}>{item.published ? "This story" : "This story · not published yet"}</Badge></Box>}
                                </Stack>
                                {isThis(item) ? (
                                  slot.max > 1 && index > 0 && <Button mode="bleed" icon={ArrowUpIcon} padding={2} fontSize={0} disabled={!!busy} title="Move it first" aria-label="Move it first" onClick={() => moveFirst(slot)} />
                                ) : (
                                  <Button mode="bleed" icon={TransferIcon} padding={2} fontSize={0} disabled={!!busy} title="Put this story here instead" aria-label={`Put this story here instead of ${item.title}`} onClick={() => put(slot, item.slug)} />
                                )}
                              </Flex>
                            </Card>
                          ))}
                        </Flex>
                      </Stack>
                    </Flex>
                  </Card>
                );
              })}
            </Stack>
          ))}

          <Card padding={3} radius={2} border>
            <Flex gap={3} align="center">
              <Switch id="place-more-news" checked={!hidden} disabled={!!busy} onChange={(event) => void save("more", {}, event.currentTarget.checked ? layout.hidden.filter((slug) => slug !== story.slug) : [...layout.hidden, story.slug], event.currentTarget.checked ? "Back in More news" : "Out of More news")} />
              <Stack gap={2} flex={1}>
                <Text as="label" htmlFor="place-more-news" weight="semibold" size={1}>More news and empty spots</Text>
                <Text size={1} muted>The More news row shows every story that isn’t in a spot above, newest first, and empty spots fill up the same way. Turn this off to keep the story out of both.</Text>
              </Stack>
            </Flex>
          </Card>
        </Stack>
      </Box>
    </Dialog>
  );
}
