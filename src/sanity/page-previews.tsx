import { ArrowRight, Check } from "lucide-react";
import type { PreviewProps } from "sanity";
import { Img } from "@/components/cards";
import { toPhoto, type SanityPhoto } from "@/lib/sanity-mapping";
import { usePageView } from "./page-editor";

// How the photo and box blocks in a story's text look in the page view of
// the studio: the same as on the site (src/routes/news.$slug.tsx). Click one
// to change it. Outside the page view they keep Sanity's usual look.

type Extra = {
  photo?: SanityPhoto; first?: SanityPhoto; second?: SanityPhoto; caption?: string;
  items?: unknown[]; label?: string; href?: string;
};
type Props = PreviewProps & Extra;

const Missing = ({ children }: { children: string }) => <span className="se-block-missing">{children}</span>;

export function StoryImagePreview(props: Props) {
  if (!usePageView()) return props.renderDefault(props);
  const photo = toPhoto(props.photo, 1400);
  return (
    <figure className="og-inline se-block">
      {photo ? <Img photo={photo} className="og-inline-photo" /> : <span className="og-inline-photo se-block-photo"><Missing>PHOTO HERE</Missing></span>}
      <figcaption>{props.caption || <Missing>CAPTION HERE</Missing>}{photo?.credit && ` Photo: ${photo.credit}.`}</figcaption>
    </figure>
  );
}

export function StoryImagePairPreview(props: Props) {
  if (!usePageView()) return props.renderDefault(props);
  const photos = [toPhoto(props.first, 900), toPhoto(props.second, 900)];
  return (
    <figure className="og-inline og-pair se-block">
      <span className="og-pair-photos">
        {photos.map((photo, index) => photo
          ? <Img key={index} photo={photo} className="og-pair-photo" />
          : <span key={index} className="og-pair-photo se-block-photo"><Missing>PHOTO HERE</Missing></span>)}
      </span>
      <figcaption>{props.caption || <Missing>CAPTION HERE</Missing>}</figcaption>
    </figure>
  );
}

export function FactsPreview(props: Props) {
  if (!usePageView()) return props.renderDefault(props);
  const items = (props.items ?? []) as { _key?: string; label?: string; value?: string }[];
  return (
    <aside className="og-facts se-block">
      <p className="og-facts-title">{typeof props.title === "string" && props.title ? props.title : <Missing>BOX TITLE HERE</Missing>}</p>
      <dl>
        {items.length ? items.map((item, index) => (
          <div key={item._key ?? index}><dt>{item.label || <Missing>LABEL</Missing>}</dt><dd>{item.value || <Missing>VALUE</Missing>}</dd></div>
        )) : <div><dt><Missing>LABEL</Missing></dt><dd><Missing>VALUE</Missing></dd></div>}
      </dl>
    </aside>
  );
}

export function ChecklistPreview(props: Props) {
  if (!usePageView()) return props.renderDefault(props);
  const items = ((props.items ?? []) as string[]);
  return (
    <aside className="og-check se-block">
      <p className="og-check-title">{typeof props.title === "string" && props.title ? props.title : <Missing>CHECKLIST TITLE HERE</Missing>}</p>
      <ul>
        {(items.length ? items : [""]).map((item, index) => (
          <li key={index}><Check size={16} strokeWidth={2.5} aria-hidden="true" /><span>{item || <Missing>POINT HERE</Missing>}</span></li>
        ))}
      </ul>
    </aside>
  );
}

export function FaqPreview(props: Props) {
  if (!usePageView()) return props.renderDefault(props);
  const items = (props.items ?? []) as { _key?: string; question?: string; answer?: string }[];
  return (
    <div className="og-faq se-block">
      {(items.length ? items : [{}]).map((item, index) => (
        <details key={item._key ?? index} open={index === 0}>
          <summary>{item.question || <Missing>QUESTION HERE</Missing>}</summary>
          <p>{item.answer || <Missing>ANSWER HERE</Missing>}</p>
        </details>
      ))}
    </div>
  );
}

export function LinkButtonPreview(props: Props) {
  if (!usePageView()) return props.renderDefault(props);
  return (
    <p className="og-cta-line se-block">
      <span className="og-cta">{props.label || "BUTTON TEXT HERE"} <ArrowRight size={16} aria-hidden="true" /></span>
      <span className="se-block-href">{props.href || "Link: not set"}</span>
    </p>
  );
}
