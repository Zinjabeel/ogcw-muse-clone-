# OGCW security setup: the steps only the owner can do

The code is ready (22 Oct 2026). These steps need your accounts, so Claude
can't do them. Do them in this order. Each one says where to click.

---

## 1. Fix email links opening "localhost" (5 minutes, do this first)

Email links take you to localhost because Supabase's **Site URL** is still
set to a localhost address. Supabase sends every email link there unless the
page asking for it is on its list of allowed addresses.

1. Go to **supabase.com → your project "One great culture world" → Authentication → URL Configuration**.
2. **Site URL**: put the live site's address, e.g. `https://ogcultureworld.com`.
   No slash at the end.
3. **Redirect URLs → Add URL**, one at a time:
   - `https://ogcultureworld.com/**` (your live address, with `/**`)
   - `https://www.ogcultureworld.com/**` (if you use www)
   - your Lovable address with `/**` (e.g. `https://your-project.lovable.app/**`)
   - `http://localhost:5174/**` (for testing on this computer)
4. Save.

From then on, a link opens on the site you asked from. Emails sent while testing
on this computer open `localhost:5174`, which only works on this computer while
the site is running there. That's expected.

## 2. Run the setup script (2 minutes)

In PowerShell, in the project folder:

```
cd "C:\Users\Ahmad\Documents\ogc muse repo clone for astra 6"; node scripts/setup-security.mjs YOUR-ADMIN-EMAIL@gmail.com
```

It:
- makes your email the admin account;
- makes a new Sanity key for the server and deletes the old one that the
  6-digit password used to hand out;
- deletes the old password (070726).

## 3. Make your admin account and turn on two-step login (3 minutes)

1. On the site, go to **/signup** and create an account with that same email.
   Or use **Continue with Google** once step 5 is done.
2. Confirm the email from the link (step 1 must be done first).
3. Go to **/work** and log in. It asks you to **turn on two-step login**:
   - install Google Authenticator, Microsoft Authenticator, Authy or 1Password on your phone;
   - scan the QR code;
   - type the 6-digit code.
4. Done. From now on, admin needs your password **and** the code from your phone.

The studio (/admin) still opens with **Continue with GitHub** on /work, as before.

## 4. Make the emails look like OGCW (10 minutes)

**Supabase → Authentication → Emails → Templates.** For each template, paste
the file's whole contents into "Message body" and set the subject from
`emails/subjects.txt`:

| Supabase template | File | Subject |
|---|---|---|
| Confirm signup | `emails/confirm-signup.html` | Confirm your email for OGCW |
| Invite user | `emails/invite.html` | You’re invited to OGCW |
| Magic link | `emails/magic-link.html` | Your OGCW login link |
| Change email address | `emails/change-email.html` | Confirm your new email for OGCW |
| Reset password | `emails/reset-password.html` | Reset your OGCW password |
| Reauthentication | `emails/reauthentication.html` | Your OGCW confirmation code |

**Supabase → Authentication → Emails → Security notifications.** Switch these
on, each with its file:

| Notification | File |
|---|---|
| Password changed | `emails/password-changed.html` |
| Email address changed | `emails/email-changed.html` |
| MFA factor enrolled | `emails/mfa-added.html` |
| MFA factor unenrolled | `emails/mfa-removed.html` |

To change the wording later, edit `scripts/build-emails.mjs`, run
`node scripts/build-emails.mjs`, and paste the files again.

## 5. Send email from your own address: Resend, free (15 minutes)

Supabase's built-in sender only sends a couple of emails an hour and often lands
in spam. Use your own domain instead:

1. Sign up at **resend.com** (free: 3,000 emails a month).
2. **Domains → Add domain** → `ogcultureworld.com`. Add the DNS records it
   shows (SPF, DKIM, and a DMARC record) where your domain is registered.
   Wait for "Verified".
3. **API Keys → Create**, with "Sending access".
4. **Supabase → Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - host `smtp.resend.com`, port `465`, username `resend`
   - password: the API key
   - sender email `no-reply@ogcultureworld.com`, sender name `OGCW`

## 6. Log in with Google / Gmail (15 minutes)

1. Go to **console.cloud.google.com**, then make a project: "OGCW".
2. **APIs & Services → OAuth consent screen**:
   - External
   - app name `OGCW`, your support email, the OGCW logo
   - your domain under "Authorized domains"
   - publish it
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - type **Web application**
   - **Authorized redirect URI**: `https://dkzjgjerfaxtjyeixpqe.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.
5. **Supabase → Authentication → Sign In / Providers → Google**: switch it on and paste both. Save.

The "Continue with Google" button then appears by itself on /login, /signup and /work.

## 7. Supabase's own protections (5 minutes)

**Authentication → Sign In / Providers → Email**:
- Confirm email: **on** (it already is).
- **Secure email change: on.**
- **Secure password change: on.**
- **Minimum password length: 12.**
- **Password requirements: "Lowercase, uppercase letters and digits"** (or "letters and digits").
- Leaked password protection: Pro plan only. OGCW checks Have I Been Pwned itself, so it's optional.

**Authentication → Multi-Factor → TOTP (App Authenticator): enabled** (the default).

**Authentication → Rate Limits.** Logins now go through OGCW's server, and the
server limits each visitor itself (5–6 wrong tries per 15 minutes per account,
30 per visitor). Supabase sees the server's address, so raise its limits so real
readers aren't blocked:
- sign-ups and sign-ins: **300** per 5 minutes
- token refreshes: **1800** per 5 minutes
- token verifications: **300** per 5 minutes

## 8. The "are you human" check: Cloudflare Turnstile, free (10 minutes)

1. Go to **dash.cloudflare.com → Turnstile → Add widget**.
   - Hostnames: your domain, your Lovable address, `localhost`.
   - Mode **Managed**.
2. Copy the **Site key** and **Secret key**.
3. **Supabase → Authentication → Attack Protection → Enable CAPTCHA protection**:
   choose Turnstile and paste the **Secret key**.
4. In the project folder:

   ```
   node scripts/setup-security.mjs YOUR-ADMIN-EMAIL@gmail.com --turnstile YOUR-SITE-KEY
   ```

   On the hosted site, add `VITE_TURNSTILE_SITE_KEY` to the host's settings and rebuild.

Do steps 3 and 4 together. With CAPTCHA on in Supabase but no site key on the
site, logins fail.

## 9. Other accounts

- **GitHub** (Zinjabeel): **Settings → Password and authentication → Enable two-factor authentication.**
  The studio login goes through GitHub, so this protects the studio.
- **Sanity**: **sanity.io/manage → project → API → CORS origins**. Keep only
  your live address(es) and `http://localhost:5174`. Under **Members**, remove
  anyone who shouldn't be there.
- **The hosted site's settings** (Lovable or your host): add
  `OGCW_ADMIN_EMAILS`, `SANITY_EDITOR_TOKEN` and, after step 8,
  `VITE_TURNSTILE_SITE_KEY`, with the same values as in `.env.local`. Never
  put them in the code.
- **Supabase connector for Claude**: reconnect it, so Claude can check the
  database's access rules (who can read, write and delete what).

## If you lose your phone

Two-step login can be switched off for an account in **Supabase →
Authentication → Users → the account → Factors → delete**. Then log in with
the password and set it up again on the new phone.
