# Putting OGCW on Vercel

Written 23 Oct 2026, updated the same evening. The code is ready on **`main`**
of **`ogcw-muse`**, which is now the main website's repo (the rebuilt site from
`ogcw-muse-clone-` was moved into it; the old live code is kept on the branch
`live-backup-2026-10-23`). The clone repo holds the same code. These are the
steps only you can do, because they need your accounts. Do them in order.

What the code does for Vercel: when Vercel builds the site, it builds the
server for Vercel (Nitro's `vercel` preset) instead of Cloudflare. Everywhere
else, Lovable included, nothing changes. It also has the TanStack Start
security update (1.168.61) that Vercel asks for (GHSA-qx66-fv34-fjm8).

**Already made a Vercel project from `ogcw-muse-clone-`?** It works as it is
(same code), but to build from the main repo from now on: your project →
**Settings → Git → Disconnect**, then **Connect Git Repository → ogcw-muse**.
Your settings and environment variables stay.

---

## 1. Make the Vercel project (5 minutes)

1. Go to **vercel.com** → **Sign Up** (or Log In) → **Continue with GitHub**, as
   **Zinjabeel**.
2. On the dashboard: **Add New…** (top right) → **Project**.
3. Under **Import Git Repository**, find **ogcw-muse** → **Import**.
   - If it isn't listed: **Adjust GitHub App Permissions** → choose Zinjabeel →
     **Only select repositories** → add `ogcw-muse` → **Save**, then back to Vercel.
4. **Configure Project** screen:

   | Setting | Value |
   |---|---|
   | Project Name | `ogcw` (any name; it becomes `ogcw.vercel.app` if free) |
   | Framework Preset | **Other** |
   | Root Directory | `./` (leave as is) |
   | Build Command | turn **Override** on → `npm run build` |
   | Output Directory | leave **empty / off** (the build writes Vercel's own format, `.vercel/output`, which Vercel picks up by itself) |
   | Install Command | leave as is (Vercel sees `bun.lock` and uses Bun, like Lovable) |

5. Open **Environment Variables** on the same screen and add the ones in step 2.
6. Press **Deploy**. The first build takes a few minutes.
7. When it says **Congratulations**, press **Continue to Dashboard**. Your address
   is under **Domains**, e.g. `https://ogcw.vercel.app`.
8. If Vercel says the deployment is **blocked by a vulnerability**: make sure it
   built the newest commit on `main`, which has the fix. Under **Deployments**,
   the top one should show the commit "OGCW: the rebuilt site…" or a newer one.
   If it shows an older commit: **Create Deployment** → branch `main` → **Create**.
   Never switch off Vercel's protection to get past it.

**Node.js version:** the site was tested on Node 24. If a build ever complains,
go to **Settings → Build and Deployment → Node.js Version → 24.x** (22.x also works).

**If the install step fails** (it shouldn't): **Settings → Build and Deployment →
Install Command → Override → `npm install`**, then **Deployments → ⋯ → Redeploy**.

## 2. Environment variables (Settings → Environment Variables)

For each one: **Key** = the name, **Value** = the value (copy it from your
`.env.local` on your computer, open it with Notepad), tick **Production** and
**Preview**, then **Save**. After adding or changing any: **Deployments → ⋯ on
the newest → Redeploy**, because the site only reads them when it's built and started.

| Name | Needed? | Where the value comes from |
|---|---|---|
| `SANITY_EDITOR_TOKEN` | **Yes** (private) | Already in your `.env.local`. To make a new one: sanity.io/manage → project → **API** → **Tokens** → **Add API token** → permission **Editor**. |
| `OGCW_ADMIN_EMAILS` | **Yes** | Your admin email(s), comma separated. Already in `.env.local`. |
| `VITE_TURNSTILE_SITE_KEY` | Only once you switch on Cloudflare Turnstile (SECURITY-SETUP.md step 8) | dash.cloudflare.com → Turnstile → your widget → **Site key**. |

Not needed: the Supabase address and its public key, and the Sanity project and
dataset, are public by design and already in the code. `OGCW_ADMIN_PASSWORD`
is no longer used. Never put any of these values in GitHub; `.env.example` lists
the names only.

## 3. Tell Supabase and Sanity about the new address (5 minutes)

Replace `ogcw.vercel.app` with your real Vercel address.

**Supabase** (logins and email links): supabase.com → your project → **Authentication
→ URL Configuration** → **Redirect URLs → Add URL**:
- `https://ogcw.vercel.app/**`
- for branch previews too: `https://*-zinjabeel.vercel.app/**` (your Vercel
  account name instead of `zinjabeel` if it's different; Vercel shows it in
  preview addresses)

Leave **Site URL** as your main address. Once ogcultureworld.com is on Vercel
(step 5), set Site URL to `https://ogcultureworld.com`.

**Sanity** (the studio at /admin, and saving with your GitHub studio login):
sanity.io/manage → project **z0ih0mun** → **API** → **CORS origins** → **Add CORS
origin** → `https://ogcw.vercel.app` → tick **Allow credentials** → **Save**.

**Cloudflare Turnstile** (only if it's on): Turnstile → your widget → **Hostnames**
→ add `ogcw.vercel.app`.

**Google login**: nothing to change; it goes through Supabase.

## 4. Check it works before using ogcultureworld.com

On your Vercel address:

1. The front page, a story, News, Explore, Trends, Shop and Forum all open.
2. **/login** with a wrong password says "That email and password don't match".
3. Log in with your real account, then **/work**: it asks for your 6-digit code.
   After the code, the **Edit site** button appears.
4. Change one word with **Edit site**, press **Save changes**, reload: it stays.
   Then change it back.
5. **/admin** → **Continue with GitHub** opens the studio (needs the Sanity CORS
   step).
6. Sign up with a new email: the confirmation email's link opens your Vercel
   address (needs the Supabase step).
7. In Vercel: your project → **Logs**. Nothing red while you click around.

## 5. Move ogcultureworld.com to Vercel (when step 4 is all good)

`ogcw-muse` is also connected to Lovable, which now shows this same code. If
the domain is connected in Lovable (**Project → Settings → Domains**), remove
it there first, so only Vercel serves ogcultureworld.com.

1. Vercel → your project → **Settings → Domains** → **Add** → `ogcultureworld.com`.
   Also add `www.ogcultureworld.com` and choose to redirect one to the other.
2. Vercel shows the DNS records to set (an **A** record and a **CNAME**). Copy
   them exactly.
3. Where the domain is registered (IONOS): **Domains & SSL → ogcultureworld.com
   → DNS** → change or add those records, then save. It can take up to a few hours.
4. When Vercel shows **Valid Configuration**, it also sets up HTTPS by itself.
5. Supabase → URL Configuration → **Site URL** → `https://ogcultureworld.com`,
   and add `https://ogcultureworld.com/**` and `https://www.ogcultureworld.com/**`
   to Redirect URLs. Sanity CORS: add `https://ogcultureworld.com` (Allow credentials).
