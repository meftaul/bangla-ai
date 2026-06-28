-- Restructure: 2-state status (drop live_session) + courses grouping.
-- No CLI / service-role key is set up, so run this by hand in the Supabase SQL editor.

-- articles: collapse live_session into published, then restrict to draft/published.
alter table public.articles drop constraint if exists articles_status_check;
update public.articles set status = 'published' where status = 'live_session';
alter table public.articles
  add constraint articles_status_check check (status in ('draft','published'));

-- courses: mutable status only; slug matches an entry in src/content/courses.ts
-- (which is the source of truth for a course's title, description, and members).
create table public.courses (
  slug       text primary key,
  status     text not null default 'draft' check (status in ('draft','published')),
  updated_at timestamptz not null default now()
);

alter table public.courses enable row level security;

-- courses: learners see published; admins see/write everything (mirrors articles).
create policy "read published or admin" on public.courses
  for select using (status = 'published' or public.is_admin());
create policy "admin writes" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed the example course as published so the existing items stay reachable.
insert into public.courses (slug, status) values ('intro-to-ai','published')
  on conflict do nothing;
