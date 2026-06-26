-- Roles + article status. No service-role key / CLI is set up, so run this
-- by hand in the Supabase SQL editor. Bootstrap the first admin at the bottom.

-- profiles: one row per auth user, carries role
create table public.profiles (
  id   uuid primary key references auth.users on delete cascade,
  role text not null default 'user' check (role in ('user','admin'))
);

-- auto-create a profile row on signup
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill any existing users
insert into public.profiles (id) select id from auth.users
  on conflict do nothing;

-- is_admin(): used by RLS and bypasses RLS itself (security definer)
create function public.is_admin() returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin');
$$;

-- articles: mutable status only; slug matches the MDX filename
create table public.articles (
  slug       text primary key,
  status     text not null default 'draft'
             check (status in ('draft','published','live_session')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.articles enable row level security;

-- profiles: a user may read their own row (for UI role checks)
create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

-- articles: users see published; admins see/write everything
create policy "read published or admin" on public.articles
  for select using (status = 'published' or public.is_admin());
create policy "admin writes" on public.articles
  for all using (public.is_admin()) with check (public.is_admin());

-- keep existing behavior: intro stays visible
insert into public.articles (slug, status) values ('intro','published')
  on conflict do nothing;

-- Bootstrap the first admin (replace the email):
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'YOUR_EMAIL');
