"use client";

import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { SOCIALS, SocialIcon } from "@/components/socials";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";

// Site footer, based on the "Footer 2" component: four link columns, a
// divider, social buttons, another divider and the copyright line. Filled
// with OGCW's own links. The template's App Store / Play Store buttons are
// left out because OGCW has no app, and its author credit becomes the OGCW
// copyright. Lucide's brand icons are swapped for the site's Instagram,
// TikTok, YouTube and X icons (lucide has no TikTok).

// A link is either a page on the site (`to`, optionally a `hash` on it) or an external / mailto `href`.
type FooterLink = { label: string; to?: "/" | "/news" | "/trends" | "/blog" | "/about"; hash?: string; href?: string };

const footerLinks: { title: string; links: FooterLink[] }[] = [
  {
    title: "Read",
    links: [
      { label: "News", to: "/news" },
      { label: "Trends", to: "/trends" },
      { label: "Blog", to: "/blog" },
      { label: "Explore", to: "/", hash: "explore-title" },
    ],
  },
  {
    title: "OGCW",
    links: [
      { label: "About OGCW", to: "/about" },
      { label: "OGCW Originals", to: "/", hash: "originals-title" },
      { label: "Shop", to: "/", hash: "shop-title" },
      { label: "Newsletter", to: "/", hash: "newsletter-title" },
    ],
  },
  {
    title: "Work with us",
    links: [
      { label: "Advertising", href: mail("Advertising") },
      { label: "Partnerships", href: mail("Partnerships") },
      { label: "Submit a story", href: mail("Submit a story") },
      { label: "Music submissions", href: mail("Music submissions") },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "General", href: mail("General") },
      { label: "Press", href: mail("Press") },
      { label: "Copyright / Content removal", href: mail("Copyright / Content removal") },
      { label: BUSINESS_EMAIL, href: `mailto:${BUSINESS_EMAIL}` },
    ],
  },
];

const linkClass = "transition-colors hover:text-foreground";

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
                  <li key={link.label} className="break-words">
                    {link.href ? (
                      <a href={link.href} className={linkClass}>
                        {/* let the email address break after the @ on narrow screens */}
                        {link.label.includes("@") ? <>{link.label.split("@")[0]}@<wbr />{link.label.split("@")[1]}</> : link.label}
                      </a>
                    ) : (
                      <Link to={link.to ?? "/"} {...(link.hash ? { hash: link.hash } : {})} className={linkClass}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="h-px bg-border" />
        {/* Social buttons + the OGCW mark (where the template had app-store buttons) */}
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
          <Link to="/" className="flex items-baseline gap-3" aria-label="OGCW home">
            <span className="font-display text-2xl tracking-wide text-foreground">OGCW</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">One Great Culture World</span>
          </Link>
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
