"use client";

import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStories } from "@/lib/stories";
import { SOCIALS, SocialIcon } from "@/components/socials";
import type { InfoSlug } from "@/components/info-pages";
import { T } from "@/components/site-text";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { LanguagePicker } from "@/components/cookie-consent";

// Site footer (see Footer2 below for the look). Lucide’s brand icons are
// swapped for the site’s Instagram, TikTok, YouTube and X icons. OGCW has no
// app yet, so the App Store / Google Play badges say "Coming soon" and don’t link.

type FooterLink =
  | { label: string; page: "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/sports" | "/originals" | "/shop" | "/explore" | "/trends" | "/forum" | "/about" }
  | { label: string; home: string } // a section on the home page, by element id
  | { label: string; info: InfoSlug } // /info/<slug>
  | { label: string; href: string }; // mailto or external

const footerLinks: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "News for you", page: "/news" },
      { label: "Music", page: "/music" },
      { label: "Gaming", page: "/games" },
      { label: "Streaming", page: "/streaming" },
      { label: "Entertainment", page: "/culture" },
      { label: "Sports", page: "/sports" },
      { label: "Shop", page: "/shop" },
      { label: "Trends", page: "/trends" },
      { label: "Explore", page: "/explore" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About OGCW", page: "/about" },
      { label: "Originals", page: "/originals" },
      { label: "Forum", page: "/forum" },
      { label: "Press", info: "press" },
      { label: "Brand", info: "brand" },
      { label: "Testimonials", info: "testimonials" },
      { label: "Work with OGCW", info: "work-with-us" },
      { label: "Newsletter", info: "newsletter" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help", info: "help" },
      { label: "FAQ", info: "faq" },
      { label: "Contact us", info: "contact" },
      { label: "Submit a story", info: "submissions" },
      { label: "Music submissions", info: "submissions" },
      { label: "Advertising", info: "work-with-us" },
      { label: "Partnerships", info: "work-with-us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", info: "terms" },
      { label: "Privacy Policy", info: "privacy" },
      { label: "Cookie Policy", info: "cookies" },
      { label: "Legal notice", info: "legal" },
      { label: "Copyright / Content removal", info: "copyright" },
      { label: "Photo credits", info: "credits" },
    ],
  },
];

// White links that glow softly on hover (.footer-link in styles.css)
const linkClass = "footer-link";
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
function FooterItem({ link }: { link: FooterLink }) {
  const label = <T k={`footer.link.${slug(link.label)}`}>{link.label}</T>;
  if ("page" in link) return <Link to={link.page} className={linkClass}>{label}</Link>;
  if ("home" in link) return <Link to="/" hash={link.home} className={linkClass}>{label}</Link>;
  if ("info" in link) return <Link to="/info/$slug" params={{ slug: link.info }} className={linkClass}>{label}</Link>;
  // let an email address break after the @ on narrow screens
  const [user, domain] = link.label.split("@");
  return <a href={link.href} className={linkClass}>{domain ? <>{user}@<wbr />{domain}</> : link.label}</a>;
}

// Store logos from Simple Icons (CC0): the Apple logo and the Google Play triangle.
const storeLogos = {
  apple:
    "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
  google:
    "M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z",
};

// App badges, styled like the template’s, but not links until the app exists.
function AppBadge({ store }: { store: "apple" | "google" }) {
  return (
    <span className="app-badge" aria-label={`${store === "apple" ? "App Store" : "Google Play"}: coming soon`}>
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true"><path d={storeLogos[store]} /></svg>
      <span className="grid gap-0.5 leading-none">
        <span className="text-[9px] font-medium uppercase tracking-[.08em] opacity-70"><T>Coming soon on</T></span>
        <span className="text-[13px] font-semibold">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </span>
  );
}

// The wall of stories under the footer: the latest stories' photos in three
// rows, tilted back like a wall of screens, tinted in the site's colour and
// drifting slowly sideways. Photos load only when the footer comes near; with
// motion turned off the wall stands still.
const WALL_ROWS = 3;
const WALL_PER_ROW = 8;

function useNear<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setNear(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, near };
}

const Svg = ({ children }: { children: ReactNode }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

/**
 * The site footer, after the Driftbar footer the owner picked (21 Oct 2026),
 * in OGCW's own colours: a full-height footer, the brand block and the link
 * columns at the top; below them a wall of the latest stories' photos, tinted
 * in the theme's colour and fading into the page; and "One Great Culture
 * World" in giant frosted glass sinking into a mist of the same colour.
 * OGCW's own words and links throughout; the chips only say what's true (the
 * story count is live).
 */
export function Footer2() {
  const stories = useStories();
  const wall = useNear<HTMLDivElement>();
  const photos = stories.all.slice(0, WALL_ROWS * WALL_PER_ROW).map((story) => story.photo);
  const rows = Array.from({ length: WALL_ROWS }, (_, row) => photos.filter((_, index) => index % WALL_ROWS === row));
  return (
    <footer className="site-footer dfoot">
      <div className="dfoot-stage" ref={wall.ref} aria-hidden="true">
        {wall.near && photos.length > 0 && (
          <div className="dfoot-wall">
            {rows.map((row, index) => (
              <div key={index} className={`dfoot-wall-row dfoot-wall-row-${index}`}>
                {/* Each row twice, so the drift loops without a seam */}
                {[...row, ...row].map((photo, i) => (
                  <span key={i} className="dfoot-tile"><img src={photo.src} alt="" loading="lazy" decoding="async" style={{ objectPosition: photo.crop?.pos ?? "50% 50%" }} /></span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="dfoot-wordmark" aria-hidden="true"><span>One Great</span><span>Culture World</span></p>
      <div className="dfoot-fog" aria-hidden="true" />

      <div className="dfoot-content">
        <div className="dfoot-brand">
          <Link to="/" className="dfoot-logo" aria-label="OGCW home"><span className="dfoot-mark" aria-hidden="true" /><T k="footer.logo">One Great Culture World</T></Link>
          <h2 className="dfoot-title"><T k="footer.title">Culture, unfiltered.</T></h2>
          <p className="dfoot-text"><T k="footer.tagline">One Great Culture World. Culture, reported from the inside.</T> <T k="footer.text">Music, gaming, streaming, entertainment and sports, with every source linked.</T></p>
          <Link to="/info/$slug" params={{ slug: "newsletter" }} className="dfoot-cta">
            <Mail aria-hidden="true" /> <T k="footer.cta">Get the OGCW newsletter</T>
          </Link>
          <p className="dfoot-copy">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> <T k="footer.name">One Great Culture World</T>. <T k="footer.rights">All rights reserved.</T>
            {/* The team's login, kept out of the way */}
            <span className="footer-work"> · <Link to="/work" className="dfoot-quiet"><T k="footer.work">For Work</T></Link></span>
          </p>
          <div className="dfoot-by">
            <T k="footer.follow">Follow OGCW</T>
            <span className="dfoot-socials">
              {SOCIALS.map((social) => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`OGCW on ${social.name}`} title={social.name} className="dfoot-social">
                  <SocialIcon path={social.path} size={12} />
                </a>
              ))}
            </span>
          </div>
          <ul className="dfoot-status" aria-label="OGCW today">
            <li className="dfoot-chip"><span className="dfoot-dot" aria-hidden="true" />{stories.all.length.toLocaleString("en-GB")} <T k="footer.chip.stories">stories</T></li>
            <li className="dfoot-chip"><Svg><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></Svg><T k="footer.chip.daily">Updated daily</T></li>
            <li className="dfoot-chip"><Svg><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Svg><T k="footer.chip.sources">Every source linked</T></li>
          </ul>
        </div>

        {footerLinks.map((item, index) => (
          <nav key={item.title} className={`dfoot-col ${index === 0 ? "dfoot-col-menu" : ""}`} aria-label={item.title}>
            <h3 className="dfoot-col-title"><T k={`footer.heading.${slug(item.title)}`}>{item.title}</T></h3>
            <ul className="dfoot-list">
              {item.links.map((link) => <li key={link.label}><FooterItem link={link} /></li>)}
              {item.title === "Legal" && <li><CookieSettingsButton className={`${linkClass} footer-button`} /></li>}
            </ul>
            {item.title === "Legal" && (
              <div className="dfoot-extras">
                <LanguagePicker />
                <AppBadge store="apple" />
                <AppBadge store="google" />
              </div>
            )}
          </nav>
        ))}
      </div>
    </footer>
  );
}
