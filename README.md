# FedEx Tracking Clone

A FedEx-style shipping and tracking site with a public tracking page, user
accounts and claims, and an admin control center backed by Supabase.

> This is a **demo / educational clone**. It is not affiliated with or endorsed by FedEx.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | FedEx-style homepage rebuilt from the real FedEx layout, with tracking, services, and promotions |
| `tracking-user.html` | Public tracking, signup/login, account dashboard, claims, images, live support chat |
| `admin-portal.html` | Admin portal for shipments, stages, scans, images, claims, and customer service |
| `assets/site.css` | Shared FedEx-style design system |
| `assets/site.js` | Mobile navigation helper used by the tracking page |
| `assets/home.js` | Homepage tracking forms, navigation, and mobile drawer behavior |
| `images/` | FedEx-style imagery used across the pages |

Open the admin portal at `/admin-portal.html` and sign in with an authorized
admin account. The homepage footer also links to it for convenience; access is
still guarded by Supabase Auth plus the admin allowlist.

## Features

- FedEx look and feel (purple `#4D148C`, orange `#FF6600`)
- Public tracking without login
- Demo tracking number: **`123456789012`**
- Supabase Auth signup/login with a persistent account dashboard
- Users can claim a shipment and see it under **My shipments**
- Admin create/edit/delete shipments
- Carrier stages: label created, carrier 1–3, warehouse, out for delivery,
  delivered, and exception
- Automatic public scan timeline, current location, and stage progress rail
- Shipment photos and proof-of-delivery images
- Live customer-service chat between signed-in users and the admin inbox
- Responsive layout for desktop and mobile

---

## Live Supabase data model

Project: `https://fsczaqtqscevllyvarwk.supabase.co`

The site is already wired to the live project. The anon key is public by design;
RLS controls access. **Never** put the service-role key in client code.

The live tables use a compact schema. Shipment metadata and scan history are
stored as JSON in `tracking_entries.status`, so **no schema migration is needed**
for the current site.

### `tracking_entries`

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key |
| `tracking_code` | Public tracking number (unique) |
| `status` | JSON string with stage, location, route, service, scan events, etc. |
| `delivery_date` | Scheduled or delivered date |
| `carrier` | Current stage key, e.g. `carrier_2` / `warehouse` |
| `user_id` | Set when a user claims the shipment |
| `created_at` | Row creation time |

JSON stored in `status`:

```json
{
  "v": 2,
  "stage": "warehouse",
  "status": "in-transit",
  "current_location": "Memphis, TN — FedEx hub",
  "service": "FedEx Express Saver",
  "origin": "Indianapolis, IN",
  "destination": "San Jose, CA",
  "weight": "3.4 lbs",
  "dimensions": "12 x 10 x 4 in",
  "pieces": 1,
  "packaging": "FedEx Box",
  "signed_by": "",
  "notes": "Internal note",
  "delivery_date": "2026-11-02",
  "events": [
    {
      "time": "2026-10-31T18:00:00.000Z",
      "stage": "warehouse",
      "description": "Arrived at Memphis warehouse",
      "location": "Memphis, TN — FedEx hub"
    }
  ],
  "claimed_at": null
}
```

### `tracking_images`

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key |
| `tracking_code` | Shipment this image belongs to |
| `image_url` | Public Storage URL or a compressed `data:image/...` URL |
| `image_name` | Image type prefix + filename, e.g. `shipment|box.jpg` or `proof|signature.jpg` |
| `uploaded_at` | Upload time (if present in the project) |

The admin first tries the public `tracking-proofs` Storage bucket. If the bucket
or its policies are missing, the image is compressed in the browser and stored
as a data URL in `tracking_images.image_url`, so uploads still work.

### Stages

| Stage key | Public label |
| --- | --- |
| `label_created` | Label created |
| `carrier_1` | Carrier 1 · Picked up |
| `carrier_2` | Carrier 2 · In transit |
| `carrier_3` | Carrier 3 · At hub |
| `warehouse` | At warehouse |
| `out_for_delivery` | Out for delivery |
| `delivered` | Delivered |
| `exception` | Exception |

`tracking_entries.carrier` stores the stage key. A plain-text legacy `status`
value is still understood and mapped to a stage automatically.

---

## User accounts

Supabase Auth is the source of truth for accounts. Signup creates a real
`auth.users` record and stores the display name in the user's metadata
(`full_name`). The tracking page reads that metadata, so the account dashboard
and name survive logout/login even when the optional `user_profiles` table is
read-only.

The live `user_profiles` table is currently **select-only** under RLS, so the
app treats a blocked profile write as non-fatal. If you want a profile row too,
run this once in **Supabase → SQL Editor**:

```sql
alter table public.user_profiles enable row level security;

drop policy if exists "profiles select own" on public.user_profiles;
create policy "profiles select own" on public.user_profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.user_profiles;
create policy "profiles insert own" on public.user_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.user_profiles;
create policy "profiles update own" on public.user_profiles
  for update using (auth.uid() = id);
```

The app only sends `id` and `full_name` to that table; it does not require an
`email` column.

Email confirmation is currently off in the project, so signup returns a session
immediately. If you turn it on later, users must confirm their email before
logging in.

---

## Optional fresh-project schema

If you create a brand-new Supabase project instead of using the live one, run:

```sql
create extension if not exists pgcrypto;

create table if not exists public.tracking_entries (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  status text not null default 'pending',
  delivery_date date,
  carrier text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_images (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null,
  image_url text not null,
  image_name text,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.tracking_entries enable row level security;
alter table public.tracking_images enable row level security;
alter table public.user_profiles enable row level security;

-- Public tracking reads; prototype admin writes with the anon key.
create policy "trackings public read" on public.tracking_entries
  for select using (true);
create policy "trackings public insert" on public.tracking_entries
  for insert with check (true);
create policy "trackings public update" on public.tracking_entries
  for update using (true);
create policy "trackings public delete" on public.tracking_entries
  for delete using (true);

create policy "images public read" on public.tracking_images
  for select using (true);
create policy "images public insert" on public.tracking_images
  for insert with check (true);
create policy "images public delete" on public.tracking_images
  for delete using (true);

create policy "profiles select own" on public.user_profiles
  for select using (auth.uid() = id);
create policy "profiles insert own" on public.user_profiles
  for insert with check (auth.uid() = id);
create policy "profiles update own" on public.user_profiles
  for update using (auth.uid() = id);
```

Optional Storage bucket for real image files:

1. **Storage → New bucket** → name `tracking-proofs`, public **on**.
2. Add public read/insert/delete policies for `storage.objects` scoped to that
   bucket. If you skip this, the site falls back to data URLs automatically.

---

## Run locally

The site is plain HTML. Serve the folder:

```bash
npx serve .
```

Then open the local URL. A static server is better than `file://` because
Supabase requests and clipboard access work more reliably over HTTP.

---

## Deploy to Netlify

`netlify.toml` publishes the repository root.

**Git deploy:** connect `aroonjaon-ui/fedex`, leave the build command empty, set
the publish directory to `.` and deploy.

**Manual deploy:** drag the `fedex-tracking-system` folder into Netlify's deploy
area.

No Netlify environment variables are required; the Supabase URL and anon key are
already included in the HTML.

---

## Deploy to Vercel

`vercel.json` tells Vercel to serve this repository as a static site from the
root directory, with no build step.

**Git deploy:** import the repository in Vercel and deploy. The included
`vercel.json` sets the framework to Other, skips the build command, and uses `.`
as the output directory.

**CLI deploy:**

```bash
npx vercel --prod
```

No Vercel environment variables are required. The site talks directly to the
same Supabase project, and all internal links use relative `.html` paths, so
`/`, `/tracking-user.html`, and `/admin-portal.html` work as-is. The
`netlify.toml` file is ignored by Vercel.

---

## Using the site

### Track and claim

1. Open **Track** and enter a tracking number.
2. Use `123456789012` for the built-in sample.
3. Log in or sign up, then click **Claim this shipment**.
4. Claimed shipments appear under **My shipments** on the account panel.

### Admin portal

- Direct URL: `/admin-portal.html`
- Sign in with an authorized Supabase Auth account.

Only email addresses listed in `ADMIN_EMAILS` inside `admin-portal.html` can open
the dashboard. To add another administrator, create the account in Supabase Auth
and add its email to that list. The same list is mirrored in `tracking-user.html`
so the admin sees an **Admin dashboard** shortcut after logging in from the public
site, and is redirected there after an admin login. Keep both lists in sync.

The admin URL is intentionally not linked from the public pages for non-admin
visitors.

Create a shipment, set its stage/location/route, add images, then use **Move
shipment** to add new scans. Every change is written to Supabase immediately and
shows on the public tracking page.

### Customer service chat

Signed-in users open the chat launcher on `tracking-user.html` (or from the
homepage) and send messages to the admin inbox. The admin sees conversations in
the **Customer service** panel on the dashboard and can reply in the same thread.
Both sides poll every four seconds while the tab is visible.

Chat threads reuse `tracking_entries` so no extra table is required:

- `tracking_code` is `CS-<user-id>`.
- `carrier` is `support_chat`.
- `status` contains `kind: "support_chat"`, the user name/email, an `updated_at`
  timestamp, and a `messages` array.
- Each message has `id`, `role` (`user` or `admin`), `body`, `at`,
  `read_by_admin`, and `read_by_user`.

Support rows are filtered out of shipment tables, tracking results, stats, and
**My shipments**. A `CS-…` code cannot be used to look up a shipment publicly.

---

## Security note

This is a prototype. Admin access is gated by Supabase Auth and an email
allowlist, but the allowlist lives in client-side code and the tracking tables
still use open RLS policies. Chat messages are stored as one JSON array and use
last-write-wins updates, so simultaneous replies are not transactionally locked.
Before production, move admin writes behind a real server-side admin role, scope
RLS to that role, remove public write policies, and store chat messages in a
dedicated table or use a transactional chat service.
