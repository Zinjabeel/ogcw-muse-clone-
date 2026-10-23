# OGCW account emails

Supabase sends these: confirm sign-up, reset password, change email,
invite, login link, reauthentication code, and the security notices.

- Each file is pasted into Supabase's template of the same name. See
  `SECURITY-SETUP.md`, step 4.
- `subjects.txt` lists each email's subject line.
- To change one, don't edit these files by hand. Edit
  `scripts/build-emails.mjs`, then run `node scripts/build-emails.mjs`, which
  writes them all again.

Links use a one-time key (`{{ .TokenHash }}`) that OGCW's server checks at
`/auth/confirm`. So they work on any device and never put a login in the
address bar.
