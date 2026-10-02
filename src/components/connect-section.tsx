import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";
import { T } from "./site-text";

// Three columns under the news front (requirements doc):
// About OGCW (who we are, vision, what we cover; the social links sit in
// the footer just below),
// Newsletter (sign-up with the doc’s CTA and what’s in it), and
// Business, Partnerships & Contact (Work With OGCW areas + business email).


const newsletterTopics = ["The week’s biggest stories", "Trending", "New music", "Pop culture", "Fashion", "Film & TV", "Sport", "OGCW exclusives"];

// TODO: point these at the Work With OGCW landing page and the contact page once they exist.
const workWith = [
  { label: "Advertising", note: "Campaigns, sponsorships and branded content" },
  { label: "Partnerships", note: "Events, collaborations and long-term partners" },
  { label: "Submit a story", note: "Tips, pitches and stories we should be telling" },
  { label: "Music submissions", note: "New releases from artists and labels" },
];

export function NewsletterForm() {
  const [done, setDone] = useState(false);
  // TODO: send to the newsletter provider once one is chosen; until then this stores nothing.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDone(true);
  };

  if (done) return <p className="ogcw-connect-thanks" role="status">Thanks! The newsletter launches soon.</p>;
  return (
    <form className="ogcw-connect-form" onSubmit={onSubmit}>
      <label htmlFor="newsletter-email" className="sr-only">Your email</label>
      <input id="newsletter-email" name="email" type="email" placeholder="Your email" autoComplete="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}

export function ConnectSection() {
  return (
    <section className="ogcw-connect" aria-label="About, newsletter and contact">
      <div className="ogcw-connect-grid">
        {/* About OGCW */}
        <section className="ogcw-connect-col" aria-labelledby="about-ogcw-title">
          <p className="ogcw-connect-label"><T k="connect.about.label">About OGCW</T></p>
          <h2 id="about-ogcw-title" className="ogcw-connect-title"><T k="connect.about.title">One Great Culture World</T></h2>
          <p className="ogcw-connect-copy">
            OGCW is an independent platform for culture and the stories around it. We cover music, fashion, film &amp; TV, sport and pop culture, reported by the people shaping them.
          </p>
          <p className="ogcw-connect-copy">
            Our idea is simple: bring culture and what’s happening right now, from all over the world, together in one place.
          </p>
          <Link to="/about" className="ogcw-connect-link"><T k="connect.about.link">More about OGCW</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </section>

        {/* Newsletter */}
        <section className="ogcw-connect-col" aria-labelledby="newsletter-title">
          <p className="ogcw-connect-label"><T k="connect.newsletter.label">Newsletter</T></p>
          <h2 id="newsletter-title" className="ogcw-connect-title"><T k="connect.newsletter.title">Stay in the culture.</T></h2>
          <p className="ogcw-connect-copy"><T k="connect.newsletter.copy">Get the biggest stories from OGCW directly to your inbox.</T></p>
          <ul className="ogcw-connect-topics" aria-label="What’s in it">
            {newsletterTopics.map((topic) => <li key={topic}>{topic}</li>)}
          </ul>
          <NewsletterForm />
        </section>

        {/* Business, Partnerships & Contact */}
        <section className="ogcw-connect-col" aria-labelledby="work-title">
          <p className="ogcw-connect-label"><T k="connect.work.label">Business & partnerships</T></p>
          <h2 id="work-title" className="ogcw-connect-title"><T k="connect.work.title">Work with OGCW</T></h2>
          <p className="ogcw-connect-copy"><T k="connect.work.copy">For brands, artists, labels, PR agencies and partners.</T></p>
          <ul className="ogcw-connect-work">
            {workWith.map((item) => (
              <li key={item.label}>
                <a href={mail(item.label)}>
                  <span>
                    <span className="ogcw-connect-work-label">{item.label}</span>
                    <span className="ogcw-connect-work-note">{item.note}</span>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <a className="ogcw-connect-email" href={`mailto:${BUSINESS_EMAIL}`}>
            <Mail size={16} aria-hidden="true" />
            {BUSINESS_EMAIL}
          </a>
        </section>
      </div>
    </section>
  );
}
