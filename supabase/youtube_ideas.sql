create extension if not exists pgcrypto;

create table if not exists public.youtube_ideas (
  id uuid primary key default gen_random_uuid(),
  input_mode text not null default '',
  input_query text not null default '',
  language text not null default '',
  market text not null default '',
  reference_data jsonb not null default '[]'::jsonb,
  ai_cards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.youtube_ideas enable row level security;
