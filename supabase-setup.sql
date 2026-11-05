-- AeroExpress Tracking prototype - Supabase setup
-- Run this in Supabase Dashboard -> SQL Editor.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1) Let signed-in users save their own account profile.
-- ---------------------------------------------------------------------------
alter table public.user_profiles enable row level security;

grant select, insert, update on public.user_profiles to authenticated;

drop policy if exists "profiles select own" on public.user_profiles;
create policy "profiles select own"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.user_profiles;
create policy "profiles insert own"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.user_profiles;
create policy "profiles update own"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2) Create the public image bucket used by the admin portal.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('tracking-proofs', 'tracking-proofs', true)
on conflict (id) do update set public = true;

drop policy if exists "tracking proofs read" on storage.objects;
create policy "tracking proofs read"
  on storage.objects for select
  using (bucket_id = 'tracking-proofs');

drop policy if exists "tracking proofs insert" on storage.objects;
create policy "tracking proofs insert"
  on storage.objects for insert
  with check (bucket_id = 'tracking-proofs');

drop policy if exists "tracking proofs update" on storage.objects;
create policy "tracking proofs update"
  on storage.objects for update
  using (bucket_id = 'tracking-proofs')
  with check (bucket_id = 'tracking-proofs');

drop policy if exists "tracking proofs delete" on storage.objects;
create policy "tracking proofs delete"
  on storage.objects for delete
  using (bucket_id = 'tracking-proofs');

-- ---------------------------------------------------------------------------
-- 3) Verification. Each query should return rows.
-- ---------------------------------------------------------------------------
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'user_profiles'
order by policyname;

select id, name, public
from storage.buckets
where id = 'tracking-proofs';

select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'tracking proofs%'
order by policyname;
