-- Migration 0003: sinkron RPG (afeksi/env/misi/album), sesi seed, cerita user penuh
-- Jalankan di: Supabase -> SQL Editor -> New query -> Run

-- 1. Sesi untuk cerita seed (tidak ada di tabel stories) -> lepas FK, tambah unique
alter table public.sessions drop constraint if exists sessions_story_id_fkey;
delete from public.sessions a using public.sessions b
  where a.ctid < b.ctid and a.owner = b.owner and a.story_id = b.story_id;
create unique index if not exists sessions_owner_story_uidx on public.sessions(owner, story_id);

-- 2. Simpan objek cerita lengkap (charactersList, env, mission, ...)
alter table public.stories add column if not exists data jsonb;

-- 3. State RPG per cerita
create table if not exists public.rpg_states (
  owner uuid references auth.users(id) on delete cascade,
  story_id text not null,
  state jsonb not null default '{}'::jsonb,
  album jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner, story_id)
);
alter table public.rpg_states enable row level security;
drop policy if exists "rpg_select_own" on public.rpg_states;
drop policy if exists "rpg_insert_own" on public.rpg_states;
drop policy if exists "rpg_update_own" on public.rpg_states;
drop policy if exists "rpg_delete_own" on public.rpg_states;
create policy "rpg_select_own" on public.rpg_states for select using (auth.uid() = owner);
create policy "rpg_insert_own" on public.rpg_states for insert with check (auth.uid() = owner);
create policy "rpg_update_own" on public.rpg_states for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "rpg_delete_own" on public.rpg_states for delete using (auth.uid() = owner);
