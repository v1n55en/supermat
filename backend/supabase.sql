-- Skema Supabase untuk Supermat backend v2 (jalankan di SQL Editor)
create extension if not exists pgcrypto;

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  brand_name text,
  niche text,
  plan text not null default 'free',
  api_key text unique,
  web_approver boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists cms_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references accounts(id) on delete cascade,
  cms_type text not null,
  config jsonb not null default '{}'::jsonb,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (user_id, cms_type)
);

create table if not exists keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references accounts(id) on delete cascade,
  keyword text not null,
  geo text default 'ID',
  ln text default 'id',
  cms_type text default 'wordpress',
  status text default 'Pending',
  schedule text default 'immediate',
  source text default 'web',
  volume integer,
  difficulty numeric,
  article jsonb,
  post_id text,
  post_status text,
  draft_url text,
  public_url text,
  error text,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists keywords_user_idx on keywords(user_id, created_at desc);
create index if not exists keywords_next_run_idx on keywords(next_run_at) where schedule in ('daily','weekly');

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references accounts(id) on delete cascade,
  plan text not null,
  status text not null default 'active',
  method text,
  amount integer,
  invoice_no text,
  dummy boolean default true,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Backend memakai service-role key, jadi RLS tidak wajib. Kalau diaktifkan, buat policy untuk service role.
