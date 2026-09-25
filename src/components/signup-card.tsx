import { useState, type FormEvent } from "react";

// Newsletter sign-up card (styles: .ogcw-signup in styles.css, from Uiverse.io
// by 0xnihilism). TODO: send the form to the newsletter provider once one is
// chosen; until then it only shows a thank-you and stores nothing.

export function SignupCard() {
  const [name, setName] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setName(String(data.get("name") ?? "").trim());
  };

  return (
    <div className="ogcw-signup">
      <div className="card">
        <div className="banner" aria-hidden="true">
          <span className="banner-text">FREE</span>
          <span className="banner-text">JOIN</span>
        </div>
        <span className="card__title">Sign up</span>
        <p className="card__subtitle">The OGCW Briefing: the five stories everyone is talking about, every Friday.</p>
        {name === null ? (
          <form className="card__form" onSubmit={onSubmit}>
            <label htmlFor="signup-name" className="sr-only">Your name</label>
            <input id="signup-name" name="name" type="text" placeholder="Your name" autoComplete="given-name" required />
            <label htmlFor="signup-email" className="sr-only">Your email</label>
            <input id="signup-email" name="email" type="email" placeholder="Your email" autoComplete="email" required />
            <button type="submit" className="sign-up">Sign up</button>
          </form>
        ) : (
          <p className="card__thanks" role="status">Thanks{name ? `, ${name}` : ""}! The Briefing launches soon.</p>
        )}
      </div>
    </div>
  );
}
