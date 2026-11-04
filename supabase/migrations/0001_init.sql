-- Migration SQL untuk Supabase — jalankan di: Supabase → SQL Editor → New query → Run
-- ===== 1. Tabel =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  safe_mode boolean not null default true,
  age_ok boolean not null default false,
  model text not null default 'recursive/flint-v1.0:free',
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id text primary key,
  owner uuid references auth.users(id) on delete cascade,
  title text not null,
  tagline text default '',
  genre text default 'Misteri',
  cover_prompt text,
  premise text default '',
  characters text default '',
  opening text default '',
  is_mature boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete cascade,
  story_id text references public.stories(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sessions_owner_idx on public.sessions(owner);
create index if not exists stories_owner_idx on public.stories(owner);

-- ===== 2. Row Level Security =====
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.sessions enable row level security;

-- profiles: user bisa lihat/ubah profile sendiri
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- stories: user baca/tulis punya sendiri (plus seed publik bisa dibaca semua)
create policy "stories_select_own" on public.stories
  for select using (auth.uid() = owner or owner is null);
create policy "stories_insert_own" on public.stories
  for insert with check (auth.uid() = owner);
create policy "stories_update_own" on public.stories
  for update using (auth.uid() = owner);
create policy "stories_delete_own" on public.stories
  for delete using (auth.uid() = owner);

-- sessions: user cuma berurusan sama sessions sendiri
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = owner);
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = owner);
create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = owner);
create policy "sessions_delete_own" on public.sessions
  for delete using (auth.uid() = owner);

-- ===== 3. Trigger: auto-buat profil saat signup =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
