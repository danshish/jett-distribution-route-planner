-- Jett Pal: bootstrap the first Jett Distribution Owner account.
-- Run this in Supabase Dashboard > SQL Editor.
-- IMPORTANT: Replace the email below with the email used to sign in to Jett Pal.
-- This script creates the initial organisation only if that account has no membership.
-- The existing organisation_creator_membership trigger grants the creator the owner role.

do $$
declare
  owner_user_id uuid;
begin
  select id into owner_user_id
  from auth.users
  where lower(email) = lower('REPLACE_WITH_YOUR_JETT_PAL_LOGIN_EMAIL')
  limit 1;

  if owner_user_id is null then
    raise exception 'No Supabase account found for the supplied email. Check the email and try again.';
  end if;

  if not exists (
    select 1 from public.memberships where user_id = owner_user_id
  ) then
    insert into public.organisations (name, created_by)
    values ('Jett Distribution', owner_user_id);
  else
    raise notice 'This account already has an organisation membership. No new organisation was created.';
  end if;
end;
$$;

-- Verify the result. Your account should show role = owner.
select
  u.email,
  o.name as organisation,
  m.role
from public.memberships m
join auth.users u on u.id = m.user_id
join public.organisations o on o.id = m.organisation_id
where lower(u.email) = lower('REPLACE_WITH_YOUR_JETT_PAL_LOGIN_EMAIL');
