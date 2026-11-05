-- Migration 0002: Favorites system
-- Jalankan di: Supabase → SQL Editor → New query → Run

-- ===== Tabel favorites =====
create table if not exists public.favorites (
  owner uuid references auth.users(id) on delete cascade,
  story_id text not null,
  created_at timestamptz not null default now(),
  primary key (owner, story_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = owner);
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = owner);
create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = owner);
