-- Hisaab cloud schema
-- Run this once in the Supabase SQL editor for your project.
-- The app uses a publishable key in the browser, so every table is protected by RLS.

create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'Lakshmi Provision Store' check (char_length(name) between 1 and 80),
  upi_id text not null default 'kirana@upi' check (char_length(upi_id) between 3 and 120),
  credit_days integer not null default 30 check (credit_days between 1 and 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_snapshots (
  shop_id uuid primary key references public.shops (id) on delete cascade,
  data jsonb not null,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_backups (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  data jsonb not null,
  reason text not null default 'manual' check (char_length(reason) <= 80),
  created_at timestamptz not null default now()
);

create index if not exists ledger_backups_shop_created_idx
  on public.ledger_backups (shop_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

-- Every new auth user gets one shop. The client can rename it later.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.shops (owner_id, name, upi_id, credit_days)
  values (new.id, 'Lakshmi Provision Store', 'kirana@upi', 30)
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Optimistic snapshot save. Returns conflict = true with the current version
-- when another device saved first.
create or replace function public.save_ledger_snapshot(
  p_shop_id uuid,
  p_data jsonb,
  p_expected_version bigint
)
returns table (version bigint, updated_at timestamptz, conflict boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_version bigint;
  v_updated_at timestamptz;
begin
  select s.version, s.updated_at
    into v_version, v_updated_at
    from public.ledger_snapshots s
   where s.shop_id = p_shop_id
   for update;

  if not found then
    insert into public.ledger_snapshots (shop_id, data, version)
    values (p_shop_id, p_data, 1)
    on conflict (shop_id) do nothing
    returning ledger_snapshots.version, ledger_snapshots.updated_at
      into v_version, v_updated_at;

    if v_version is null then
      select s.version, s.updated_at
        into v_version, v_updated_at
        from public.ledger_snapshots s
       where s.shop_id = p_shop_id;
      return query select v_version, v_updated_at, true;
      return;
    end if;

    return query select v_version, v_updated_at, false;
    return;
  end if;

  if p_expected_version is null or v_version <> p_expected_version then
    return query select v_version, v_updated_at, true;
    return;
  end if;

  update public.ledger_snapshots s
     set data = p_data,
         version = s.version + 1,
         updated_at = now()
   where s.shop_id = p_shop_id
  returning s.version, s.updated_at into v_version, v_updated_at;

  return query select v_version, v_updated_at, false;
end;
$$;

alter table public.shops enable row level security;
alter table public.ledger_snapshots enable row level security;
alter table public.ledger_backups enable row level security;

drop policy if exists shops_owner_all on public.shops;
create policy shops_owner_all on public.shops
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists snapshots_owner_all on public.ledger_snapshots;
create policy snapshots_owner_all on public.ledger_snapshots
  for all
  using (
    exists (
      select 1 from public.shops s
       where s.id = ledger_snapshots.shop_id
         and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops s
       where s.id = ledger_snapshots.shop_id
         and s.owner_id = auth.uid()
    )
  );

drop policy if exists backups_owner_all on public.ledger_backups;
create policy backups_owner_all on public.ledger_backups
  for all
  using (
    exists (
      select 1 from public.shops s
       where s.id = ledger_backups.shop_id
         and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops s
       where s.id = ledger_backups.shop_id
         and s.owner_id = auth.uid()
    )
  );

revoke all on public.shops from anon;
revoke all on public.ledger_snapshots from anon;
revoke all on public.ledger_backups from anon;

grant select, insert, update, delete on public.shops to authenticated;
grant select, insert, update, delete on public.ledger_snapshots to authenticated;
grant select, insert, delete on public.ledger_backups to authenticated;
grant execute on function public.save_ledger_snapshot(uuid, jsonb, bigint) to authenticated;
