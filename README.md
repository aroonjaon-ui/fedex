# FedEx Tracking Clone

A FedEx-style shipping and tracking website with a public tracking page, user
accounts, and an admin portal backed by Supabase.

> This is a **demo / educational clone**. It is not affiliated with or endorsed by FedEx.

## What's included

| Page | Purpose |
| --- | --- |
| `index.html` | FedEx-style homepage with hero, services, promos, and tracking box |
| `tracking-user.html` | Public tracking page + optional login/signup |
| `admin-portal.html` | Admin dashboard to add/update shipments and upload proof images |
| `assets/site.css` | Shared FedEx-style design system |
| `images/` | FedEx imagery used across the pages |

### Features

- FedEx look and feel (purple `#4D148C` / orange `#FF6600`, header, footer, hero)
- Public package tracking with status summary, progress rail, shipment facts,
  and a travel-history timeline
- Demo tracking number: **`123456789012`**
- User signup / login (Supabase Auth)
- Admin portal: create/update/delete shipments, upload proof-of-delivery images

---

## 1. Supabase setup

Project used by the pages: `https://fsczaqtqscevllyvarwk.supabase.co`

The URL and **anon** key are embedded in `tracking-user.html` and
`admin-portal.html`. The anon key is designed to be public; security is enforced
with Row Level Security (RLS). **Never** put the service-role key in client code.

### 1a. Create the tables

Open **Supabase Dashboard → SQL Editor**, paste and run:

```sql
-- ============ TABLES ============
create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_entries (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  status text not null default 'pending',
  delivery_date date,
  service text,
  origin text,
  destination text,
  weight text,
  dimensions text,
  pieces int default 1,
  packaging text,
  signed_by text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracking_images (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null,
  image_url text not null,
  image_name text,
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table public.user_profiles    enable row level security;
alter table public.tracking_entries enable row level security;
alter table public.tracking_images  enable row level security;

-- user_profiles: each user can only read/write their own row
drop policy if exists "profiles select own" on public.user_profiles;
create policy "profiles select own" on public.user_profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.user_profiles;
create policy "profiles insert own" on public.user_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.user_profiles;
create policy "profiles update own" on public.user_profiles
  for update using (auth.uid() = id);

-- tracking_entries / tracking_images:
-- PUBLIC read (so the tracking page works without login) and
-- PUBLIC write for this prototype (the admin portal uses the anon key).
-- NOTE: open writes are fine for a demo but should be replaced with
-- authenticated admin-only policies before any real use.
drop policy if exists "trackings public read"   on public.tracking_entries;
create policy "trackings public read"   on public.tracking_entries for select using (true);

drop policy if exists "trackings public insert" on public.tracking_entries;
create policy "trackings public insert" on public.tracking_entries for insert with check (true);

drop policy if exists "trackings public update" on public.tracking_entries;
create policy "trackings public update" on public.tracking_entries for update using (true);

drop policy if exists "trackings public delete" on public.tracking_entries;
create policy "trackings public delete" on public.tracking_entries for delete using (true);

drop policy if exists "images public read"      on public.tracking_images;
create policy "images public read"      on public.tracking_images for select using (true);

drop policy if exists "images public insert"    on public.tracking_images;
create policy "images public insert"    on public.tracking_images for insert with check (true);

drop policy if exists "images public delete"    on public.tracking_images;
create policy "images public delete"    on public.tracking_images for delete using (true);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_tracking_updated on public.tracking_entries;
create trigger trg_tracking_updated
  before update on public.tracking_entries
  for each row execute function public.set_updated_at();
```

> If you already created `tracking_entries` previously, the `create table if not exists`
> will not add the new columns. Run this to add them:
>
> ```sql
> alter table public.tracking_entries
>   add column if not exists service text,
>   add column if not exists origin text,
>   add column if not exists destination text,
>   add column if not exists weight text,
>   add column if not exists dimensions text,
>   add column if not exists pieces int default 1,
>   add column if not exists packaging text,
>   add column if not exists signed_by text;
> ```

### 1b. Create the Storage bucket

**Supabase Dashboard → Storage → New bucket**

- Name: `tracking-proofs`
- Public bucket: **on**

Then add policies (Storage → `tracking-proofs` → Policies) so the demo admin can
upload and everyone can view:

```sql
-- allow public read of proof images
create policy "proofs public read"
  on storage.objects for select
  using (bucket_id = 'tracking-proofs');

-- allow uploads for the prototype admin
create policy "proofs public insert"
  on storage.objects for insert
  with check (bucket_id = 'tracking-proofs');

-- allow deletes for the prototype admin
create policy "proofs public delete"
  on storage.objects for delete
  using (bucket_id = 'tracking-proofs');
```

### 1c. Email confirmation (optional, recommended for testing)

**Authentication → Providers → Email** → turn **off** *Confirm email* so new
signups can log in immediately. If you leave it on, users must click the
confirmation link before logging in.

---

## 2. Run locally

Because the site is plain HTML, just open `index.html` in a browser, or serve the
folder:

```bash
# any static server works
npx serve .
```

Then visit `http://localhost:3000`.

---

## 3. Deploy to Netlify

The repo is ready to deploy as a static site (`netlify.toml` publishes the repo root).

**Option A — Git (recommended):**

1. Netlify → **Add new site → Import an existing project**
2. Connect `aroonjaon-ui/fedex`
3. Build command: *(leave empty)* — Publish directory: `.`
4. Deploy

**Option B — Drag & drop:**

1. Netlify → **Sites → Add new site → Deploy manually**
2. Drag the whole `fedex-tracking-system` folder (or its contents) into the drop area

You do **not** need environment variables on Netlify — the Supabase URL and anon
key are already in the HTML files.

---

## 4. Using the site

### Track a package
- Go to **Track** and enter `123456789012` to see a sample shipment.
- Shipments you add in the admin portal are trackable by their tracking code.

### Admin portal
- URL: `/admin-portal.html`
- Email: `admin@fedex-tracking.local`
- Password: `Admin123!`

From the admin portal you can add/update shipments (status, delivery date,
route, weight, etc.) and upload proof-of-delivery images.

### User accounts
- Click **Log In / Sign Up** on the tracking page to create an account.

---

## Security note

This is a prototype. Open write policies and hard-coded admin credentials are used
so the demo works without extra backend code. For production you should:

- Move admin actions behind a real authenticated admin role (Supabase Auth + RLS
  policies scoped to that role), and remove public write policies.
- Remove the hard-coded admin credentials.
- Consider using Supabase Edge Functions for privileged operations.
