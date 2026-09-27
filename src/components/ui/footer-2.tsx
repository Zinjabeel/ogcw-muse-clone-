"use client";

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { SOCIALS, SocialIcon } from "@/components/socials";
import type { InfoSlug } from "@/components/info-pages";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";

// Site footer, based on the "Footer 2" component: four link columns, a
// divider, social buttons + app badges, another divider and the copyright.
// Filled with OGCW's own links; the template's Linktree items don't apply.
// Lucide's brand icons are swapped for the site's Instagram, TikTok,
// YouTube and X icons (lucide has no TikTok). OGCW has no app yet, so the
// App Store / Google Play badges are marked "Coming soon" and don't link.

type FooterLink =
  | { label: string; page: "/news" | "/trends" | "/blog" | "/about" }
  | { label: string; home: string } // a section on the home page, by element id
  | { label: string; info: InfoSlug } // /info/<slug>
  | { label: string; href: string }; // mailto or external

const footerLinks: { title: string; links: FooterLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About OGCW", page: "/about" },
      { label: "OGCW Originals", home: "originals-title" },
      { label: "Blog", page: "/blog" },
      { label: "Press", info: "press" },
      { label: "Brand", info: "brand" },
      { label: "Testimonials", info: "testimonials" },
      { label: "Work with OGCW", home: "work-title" },
      { label: "Newsletter", home: "newsletter-title" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "News", page: "/news" },
      { label: "Trends", page: "/trends" },
      { label: "Latest & Most Read", home: "explore-title" },
      { label: "Shop", home: "shop-title" },
      { label: "Submit a story", href: mail("Submit a story") },
      { label: "Music submissions", href: mail("Music submissions") },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help", info: "help" },
      { label: "FAQ", info: "faq" },
      { label: "Contact us", href: mail("General") },
      { label: "Advertising", href: mail("Advertising") },
      { label: "Partnerships", href: mail("Partnerships") },
      { label: BUSINESS_EMAIL, href: `mailto:${BUSINESS_EMAIL}` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", info: "terms" },
      { label: "Privacy Policy", info: "privacy" },
      { label: "Cookie Policy", info: "cookies" },
      { label: "Legal notice", info: "legal" },
      { label: "Copyright / Content removal", href: mail("Copyright / Content removal") },
      { label: "Photo credits", info: "credits" },
    ],
  },
];

// White links that glow softly on hover (.footer-link in styles.css)
const linkClass = "footer-link";
function FooterItem({ link }: { link: FooterLink }) {
  if ("page" in link) return <Link to={link.page} className={linkClass}>{link.label}</Link>;
  if ("home" in link) return <Link to="/" hash={link.home} className={linkClass}>{link.label}</Link>;
  if ("info" in link) return <Link to="/info/$slug" params={{ slug: link.info }} className={linkClass}>{link.label}</Link>;
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

// App badges, styled like the template's, but not links until the app exists.
function AppBadge({ store }: { store: "apple" | "google" }) {
  return (
    <span className="app-badge" aria-label={`${store === "apple" ? "App Store" : "Google Play"}: coming soon`}>
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true"><path d={storeLogos[store]} /></svg>
      <span className="grid leading-none">
        <span className="text-[10px] font-medium">Coming soon on</span>
        <span className="text-base font-semibold">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </span>
  );
}

// The footer's contents slide up and fade in the first time it scrolls into
// view. It only hides them once JavaScript is running and the footer is still
// below the fold, so it never stays invisible; reduced-motion users skip it.
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen
    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, state };
}

export function Footer2() {
  const reveal = useScrollReveal<HTMLElement>();
  return (
    <footer ref={reveal.ref} data-reveal={reveal.state} className="site-footer border-t bg-background text-foreground font-sans">
      <div className="page-wrap">
        {/* Grid container with headings and links */}
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {footerLinks.map((item, index) => (
            <div key={item.title} className="footer-reveal" style={{ ["--i" as string]: index }}>
              <h3 className="mb-4 text-xs font-medium text-foreground">{item.title}</h3>
              <ul className="space-y-2 text-sm">
                {item.links.map((link) => (
                  <li key={link.label}><FooterItem link={link} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-reveal h-px bg-border" style={{ ["--i" as string]: 4 }} />
        {/* Social buttons + app badges */}
        <div className="footer-reveal flex flex-wrap items-center justify-between gap-4 py-5" style={{ ["--i" as string]: 4 }}>
          <div className="flex items-center gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`OGCW on ${social.name}`}
                title={social.name}
                className={`${buttonVariants({ variant: "outline", size: "icon" })} footer-social`}
              >
                <SocialIcon path={social.path} size={16} />
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <AppBadge store="apple" />
            <AppBadge store="google" />
          </div>
        </div>
        <div className="footer-reveal h-px bg-border" style={{ ["--i" as string]: 5 }} />
        <div className="footer-reveal py-4 text-center text-xs text-foreground" style={{ ["--i" as string]: 5 }}>
          <p>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            <Link to="/" className="footer-link">One Great Culture World</Link>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
