"use client";

import { Link } from "@tanstack/react-router";
import { Apple, Play } from "lucide-react";
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
    ],
  },
];

const linkClass = "transition-colors hover:text-foreground";

function FooterItem({ link }: { link: FooterLink }) {
  if ("page" in link) return <Link to={link.page} className={linkClass}>{link.label}</Link>;
  if ("home" in link) return <Link to="/" hash={link.home} className={linkClass}>{link.label}</Link>;
  if ("info" in link) return <Link to="/info/$slug" params={{ slug: link.info }} className={linkClass}>{link.label}</Link>;
  // let an email address break after the @ on narrow screens
  const [user, domain] = link.label.split("@");
  return <a href={link.href} className={linkClass}>{domain ? <>{user}@<wbr />{domain}</> : link.label}</a>;
}

// App badges, styled like the template's, but not links until the app exists.
function AppBadge({ store }: { store: "apple" | "google" }) {
  const Icon = store === "apple" ? Apple : Play;
  return (
    <span className="app-badge" aria-label={`${store === "apple" ? "App Store" : "Google Play"}: coming soon`}>
      <Icon size={22} strokeWidth={store === "apple" ? 1.8 : 1.6} fill={store === "apple" ? "currentColor" : "none"} aria-hidden="true" />
      <span className="grid leading-none">
        <span className="text-[10px] font-medium">Coming soon on</span>
        <span className="text-base font-semibold">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </span>
  );
}

export function Footer2() {
  return (
    <footer className="border-t bg-card/60 font-sans">
      <div className="page-wrap">
        {/* Grid container with headings and links */}
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {footerLinks.map((item) => (
            <div key={item.title}>
              <h3 className="mb-4 text-xs font-medium text-foreground">{item.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {item.links.map((link) => (
                  <li key={link.label}><FooterItem link={link} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="h-px bg-border" />
        {/* Social buttons + app badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`OGCW on ${social.name}`}
                title={social.name}
                className={`${buttonVariants({ variant: "outline", size: "icon" })} text-muted-foreground hover:border-accent`}
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
        <div className="h-px bg-border" />
        <div className="py-4 text-center text-xs text-muted-foreground">
          <p>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            <Link to="/" className="hover:text-foreground hover:underline">One Great Culture World</Link>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
