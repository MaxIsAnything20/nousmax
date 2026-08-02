-- StudyForge - Phase 2 database schema (run once in Supabase SQL Editor)
-- Postgres + Row Level Security so each user only sees their own data.

create table if not exists public.sources (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    kind         text not null check (kind in ('file','video')),
    name         text not null,
    meta         text,
    storage_path text,
    source_url   text,
    content_text text,
    status       text not null default 'processing' check (status in ('processing','ready','error')),
    created_at   timestamptz not null default now()
  );

create table if not exists public.generations (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    source_id  uuid not null references public.sources(id) on delete cascade,
    type       text not null check (type in ('quiz','summary','flashcards')),
    payload    jsonb not null,
    created_at timestamptz not null default now()
  );

create table if not exists public.card_progress (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    generation_id uuid not null references public.generations(id) on delete cascade,
    card_key      text not null,
    ease          real not null default 2.5,
    interval_days int  not null default 0,
    reps          int  not null default 0,
    due_at        timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    unique (user_id, generation_id, card_key)
  );

create table if not exists public.study_events (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    kind       text not null,
    meta       jsonb,
    created_at timestamptz not null default now()
  );

create index if not exists sources_user_idx       on public.sources(user_id, created_at desc);
create index if not exists generations_source_idx on public.generations(source_id, created_at desc);
create index if not exists card_progress_due_idx   on public.card_progress(user_id, due_at);
create index if not exists study_events_user_idx   on public.study_events(user_id, created_at);

alter table public.sources       enable row level security;
alter table public.generations   enable row level security;
alter table public.card_progress enable row level security;
alter table public.study_events  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sources','generations','card_progress','study_events'] loop
    execute format('drop policy if exists "own_rows" on public.%I;', t);
    execute format(
            'create policy "own_rows" on public.%I
               for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
  values ('sources','sources', false)
  on conflict (id) do nothing;

drop policy if exists "sources_rw_own" on storage.objects;
create policy "sources_rw_own" on storage.objects
  for all to authenticated
  using   (bucket_id = 'sources' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'sources' and (storage.foldername(name))[1] = auth.uid()::text);
