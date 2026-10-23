// Builds OGCW's account emails (emails/*.html) from one layout, for
// Supabase's email templates (Authentication → Emails). Run it after
// changing the words or the look:
//
//   node scripts/build-emails.mjs
//
// Then paste each file into the template of the same name in Supabase (see
// emails/README.md). The layout is built for email programs: tables, inline
// styles, no web fonts or pictures (Gmail and Outlook block those), a
// 600px column that shrinks on phones, and a plain link under every button.
// The links use a one-time key ({{ .TokenHash }}) checked by OGCW's own
// server at /auth/confirm, so they work on any device and never put a login
// in the address bar.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "emails");

const INK = "#0d0d0d";
const YELLOW = "#ffe600";
const PAPER = "#f4f3ef";
const GREY = "#5b5a55";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const link = (type) => `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=${type}`;

/** One email: a black masthead with the yellow mark, a white card, a big serif headline, the button, a plain link, a safety note, the footer */
function email({ preheader, kicker, title, intro, button, href, after, code, note }) {
  const buttonBlock = button
    ? `
            <tr><td style="padding:8px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td bgcolor="${YELLOW}" style="border-radius:10px;">
                  <a href="${href}" target="_blank" style="display:inline-block;padding:16px 28px;font-family:${SANS};font-size:16px;font-weight:700;line-height:1;color:${INK};text-decoration:none;border-radius:10px;">${button}&nbsp;&rarr;</a>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:22px 40px 0 40px;font-family:${SANS};font-size:13px;line-height:20px;color:${GREY};">
              Button not working? Copy this link into your browser:<br>
              <a href="${href}" target="_blank" style="color:${INK};word-break:break-all;">${href}</a>
            </td></tr>`
    : "";
  const codeBlock = code
    ? `
            <tr><td style="padding:8px 40px 0 40px;">
              <div style="display:inline-block;padding:16px 24px;border-radius:12px;background:${PAPER};border:1px solid #e3e1da;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:${INK};">${code}</div>
            </td></tr>`
    : "";
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${title}</title>
  <style>
    @media (max-width: 620px) {
      .card { width: 100% !important; border-radius: 0 !important; }
      .pad { padding-left: 24px !important; padding-right: 24px !important; }
      .headline { font-size: 30px !important; line-height: 36px !important; }
    }
    a { color: ${INK}; }
  </style>
</head>
<body style="margin:0;padding:0;background:${PAPER};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06);">
        <!-- Masthead -->
        <tr><td bgcolor="${INK}" style="background:${INK};padding:26px 40px;" class="pad">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-family:${SERIF};font-size:26px;font-weight:700;letter-spacing:6px;color:#ffffff;">
              <span style="display:inline-block;width:14px;height:14px;margin-right:12px;background:${YELLOW};vertical-align:middle;"></span>OGCW
            </td>
            <td align="right" style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#bdbbb4;">One Great Culture World</td>
          </tr></table>
        </td></tr>
        <tr><td bgcolor="${YELLOW}" style="background:${YELLOW};height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td class="pad" style="padding:40px 40px 0 40px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${GREY};">${kicker}</td></tr>
            <tr><td class="pad headline" style="padding:12px 40px 0 40px;font-family:${SERIF};font-size:36px;line-height:42px;font-weight:400;letter-spacing:-0.5px;color:${INK};">${title}</td></tr>
            <tr><td class="pad" style="padding:18px 40px 18px 40px;font-family:${SANS};font-size:16px;line-height:26px;color:#2b2a27;">${intro}</td></tr>${codeBlock}${buttonBlock}
            ${after ? `<tr><td class="pad" style="padding:22px 40px 0 40px;font-family:${SANS};font-size:15px;line-height:24px;color:#2b2a27;">${after}</td></tr>` : ""}
            <tr><td class="pad" style="padding:28px 40px 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="border-left:4px solid ${YELLOW};padding:12px 16px;background:${PAPER};font-family:${SANS};font-size:13px;line-height:20px;color:${GREY};">${note}</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td bgcolor="${INK}" class="pad" style="background:${INK};padding:24px 40px;font-family:${SANS};font-size:12px;line-height:19px;color:#bdbbb4;">
          <span style="font-family:${SERIF};font-size:15px;color:#ffffff;">Culture, unfiltered.</span><br>
          You’re getting this because of your OGCW account ({{ .Email }}). OGCW will never ask for your password or your two-step code by email, phone or message.<br>
          <a href="{{ .SiteURL }}" style="color:${YELLOW};text-decoration:none;">ogcultureworld.com</a> &nbsp;·&nbsp; <a href="mailto:business@ogcultureworld.com" style="color:${YELLOW};text-decoration:none;">business@ogcultureworld.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

const NOT_YOU = "Didn’t ask for this? You can ignore this email: nothing changes unless the link is opened.";
const CHANGED = "Wasn’t you? Reset your password straight away from the login page and turn on two-step login, then email <a href=\"mailto:business@ogcultureworld.com?subject=Account%20security\" style=\"color:#0d0d0d;\">business@ogcultureworld.com</a> so we can help.";

const EMAILS = {
  "confirm-signup": {
    subject: "Confirm your email for OGCW",
    preheader: "One tap and your OGCW account is ready.",
    kicker: "Welcome to OGCW",
    title: "Confirm your email",
    intro: "Thanks for joining One Great Culture World. Tap the button to confirm this is your address, and your account is ready on any device.",
    button: "Confirm my email",
    href: link("signup"),
    after: "The link works once, for 24 hours.",
    note: NOT_YOU,
  },
  invite: {
    subject: "You’re invited to OGCW",
    preheader: "Your invitation to One Great Culture World.",
    kicker: "You’re invited",
    title: "Join OGCW",
    intro: "You’ve been invited to an account on One Great Culture World. Accept the invitation to set it up.",
    button: "Accept the invitation",
    href: link("invite"),
    after: "The link works once, for 24 hours.",
    note: NOT_YOU,
  },
  "magic-link": {
    subject: "Your OGCW login link",
    preheader: "Log in to OGCW with one tap.",
    kicker: "Log in",
    title: "Your login link",
    intro: "Tap the button to log in to your OGCW account on this device.",
    button: "Log me in",
    href: link("magiclink"),
    after: "The link works once, for one hour.",
    note: NOT_YOU,
  },
  "change-email": {
    subject: "Confirm your new email for OGCW",
    preheader: "Confirm the change to your OGCW email address.",
    kicker: "Your account",
    title: "Confirm your new email",
    intro: "Someone asked to change the email address on an OGCW account from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>. Tap the button to confirm it was you.",
    button: "Confirm the change",
    href: link("email_change"),
    after: "The link works once, for 24 hours.",
    note: "Didn’t ask for this? Don’t open the link, and change your password from the login page.",
  },
  "reset-password": {
    subject: "Reset your OGCW password",
    preheader: "Choose a new password for your OGCW account.",
    kicker: "Your account",
    title: "Choose a new password",
    intro: "Someone asked to reset the password for your OGCW account. Tap the button to choose a new one. Once it’s saved, every other device logged in to your account is logged out.",
    button: "Choose a new password",
    href: link("recovery"),
    after: "The link works once, for one hour.",
    note: "Didn’t ask for this? You can ignore this email: your password stays the same unless the link is opened. If you get several you didn’t ask for, turn on two-step login on your account page.",
  },
  reauthentication: {
    subject: "Your OGCW confirmation code",
    preheader: "Your code to confirm it’s you.",
    kicker: "Confirm it’s you",
    title: "Your code",
    intro: "Type this code on OGCW to confirm it’s you:",
    code: "{{ .Token }}",
    after: "It works once, for a few minutes. Never share it with anyone, not even someone who says they’re from OGCW.",
    note: NOT_YOU,
  },
  "password-changed": {
    subject: "Your OGCW password was changed",
    preheader: "The password on your OGCW account was just changed.",
    kicker: "Security",
    title: "Your password was changed",
    intro: "The password on your OGCW account (<strong>{{ .Email }}</strong>) was just changed, and every other device was logged out. If that was you, there’s nothing more to do.",
    note: CHANGED,
  },
  "email-changed": {
    subject: "Your OGCW email address was changed",
    preheader: "The email address on your OGCW account was changed.",
    kicker: "Security",
    title: "Your email address was changed",
    intro: "The email address on your OGCW account was changed to <strong>{{ .Email }}</strong>. If that was you, there’s nothing more to do.",
    note: CHANGED,
  },
  "mfa-added": {
    subject: "Two-step login is on for your OGCW account",
    preheader: "Your OGCW account now asks for a code after your password.",
    kicker: "Security",
    title: "Two-step login is on",
    intro: "From now on, logging in to your OGCW account (<strong>{{ .Email }}</strong>) takes your password <em>and</em> the 6-digit code from your authenticator app. Good move.",
    note: CHANGED,
  },
  "mfa-removed": {
    subject: "Two-step login was turned off on your OGCW account",
    preheader: "Your OGCW account no longer asks for a code.",
    kicker: "Security",
    title: "Two-step login was turned off",
    intro: "Your OGCW account (<strong>{{ .Email }}</strong>) no longer asks for a code from your authenticator app when you log in. You can turn it on again on your account page.",
    note: CHANGED,
  },
};

await mkdir(OUT, { recursive: true });
const subjects = [];
for (const [name, words] of Object.entries(EMAILS)) {
  await writeFile(join(OUT, `${name}.html`), email(words), "utf8");
  subjects.push(`${name}.html\t${words.subject}`);
}
await writeFile(join(OUT, "subjects.txt"), `${subjects.join("\n")}\n`, "utf8");
console.log(`Wrote ${subjects.length} emails to ${OUT}`);
