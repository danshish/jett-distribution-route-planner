-- Jett Pal commercial foundation: multi-company schema and tenant isolation
-- Run once in the Supabase SQL Editor for the Jett Pal project.
-- This migration deliberately does not add billing or alter the existing mobile app.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'driver'
    check (role in ('owner', 'admin', 'manager', 'driver', 'operative')),
  created_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  registration text,
  vehicle_type text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  employee_id text,
  phone text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  assigned_driver_id uuid references public.drivers(id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  route_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  route_id uuid references public.routes(id) on delete set null,
  address text not null,
  town text,
  postcode text,
  wheelie_bins_required integer not null default 0 check (wheelie_bins_required >= 0),
  food_caddies_required integer not null default 0 check (food_caddies_required >= 0),
  wheelie_bins_delivered integer not null default 0 check (wheelie_bins_delivered >= 0),
  food_caddies_delivered integer not null default 0 check (food_caddies_delivered >= 0),
  outcome text not null default 'pending'
    check (outcome in ('pending', 'delivered', 'partially_delivered', 'no_access', 'wrong_address', 'damaged_item', 'customer_not_home')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists vehicles_org_idx on public.vehicles(organisation_id);
create index if not exists drivers_org_idx on public.drivers(organisation_id);
create index if not exists routes_org_date_idx on public.routes(organisation_id, route_date);
create index if not exists deliveries_org_route_idx on public.deliveries(organisation_id, route_id);

-- Security-definer helpers avoid recursive membership-table RLS checks.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = target_org
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

-- Automatically make the creator the organisation owner.
create or replace function public.add_organisation_creator_as_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (organisation_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

drop trigger if exists organisation_creator_membership on public.organisations;
create trigger organisation_creator_membership
after insert on public.organisations
for each row execute function public.add_organisation_creator_as_owner();

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.memberships enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.routes enable row level security;
alter table public.deliveries enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
for select to authenticated using (id = auth.uid());
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check (id = auth.uid());
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Members can view their organisations" on public.organisations;
create policy "Members can view their organisations" on public.organisations
for select to authenticated using (public.is_org_member(id));
drop policy if exists "Authenticated users can create organisations" on public.organisations;
create policy "Authenticated users can create organisations" on public.organisations
for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "Owners and admins can update organisations" on public.organisations;
create policy "Owners and admins can update organisations" on public.organisations
for update to authenticated
using (public.has_org_role(id, array['owner', 'admin']))
with check (public.has_org_role(id, array['owner', 'admin']));

drop policy if exists "Members can view organisation memberships" on public.memberships;
create policy "Members can view organisation memberships" on public.memberships
for select to authenticated using (public.is_org_member(organisation_id));
drop policy if exists "Owners and admins can add memberships" on public.memberships;
create policy "Owners and admins can add memberships" on public.memberships
for insert to authenticated
with check (public.has_org_role(organisation_id, array['owner', 'admin']));
drop policy if exists "Owners and admins can update memberships" on public.memberships;
create policy "Owners and admins can update memberships" on public.memberships
for update to authenticated
using (public.has_org_role(organisation_id, array['owner', 'admin']))
with check (public.has_org_role(organisation_id, array['owner', 'admin']));
drop policy if exists "Owners and admins can remove memberships" on public.memberships;
create policy "Owners and admins can remove memberships" on public.memberships
for delete to authenticated
using (public.has_org_role(organisation_id, array['owner', 'admin']));

-- Operational records are visible only inside the caller's organisation.
-- Initial pilot permissions allow members to work with shared operational data.
-- More restrictive driver/operative assignment rules will be added before launch.
drop policy if exists "Members manage own organisation vehicles" on public.vehicles;
create policy "Members manage own organisation vehicles" on public.vehicles
for all to authenticated
using (public.is_org_member(organisation_id))
with check (public.is_org_member(organisation_id));

drop policy if exists "Members manage own organisation drivers" on public.drivers;
create policy "Members manage own organisation drivers" on public.drivers
for all to authenticated
using (public.is_org_member(organisation_id))
with check (public.is_org_member(organisation_id));

drop policy if exists "Members manage own organisation routes" on public.routes;
create policy "Members manage own organisation routes" on public.routes
for all to authenticated
using (public.is_org_member(organisation_id))
with check (public.is_org_member(organisation_id));

drop policy if exists "Members manage own organisation deliveries" on public.deliveries;
create policy "Members manage own organisation deliveries" on public.deliveries
for all to authenticated
using (public.is_org_member(organisation_id))
with check (public.is_org_member(organisation_id));

-- Keep direct table access limited to authenticated users.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.organisations to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.drivers to authenticated;
grant select, insert, update, delete on public.routes to authenticated;
grant select, insert, update, delete on public.deliveries to authenticated;
