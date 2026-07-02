-- Pathshala schema, day 0. No service-role key / CLI is wired up, so run this
-- by hand in the Supabase SQL editor. Bootstrap the first admin at the bottom.

-- ── profiles: one row per auth user, carries role ──────────────────────────
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

-- ── articles: mutable status only; slug matches the MDX filename ────────────
create table public.articles (
  slug       text primary key,
  status     text not null default 'draft' check (status in ('draft','published')),
  updated_at timestamptz not null default now()
);

-- ── courses: mutable status only; slug matches an entry in src/content/courses.ts
create table public.courses (
  slug       text primary key,
  status     text not null default 'draft' check (status in ('draft','published')),
  updated_at timestamptz not null default now()
);

-- ── sessions: one row per run of an article (same article can run many times) ─
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null references public.articles(slug),
  join_code     text not null unique,
  status        text not null default 'live' check (status in ('live','ended')),
  current_slide int  not null default 0,          -- presenter's slide, for late joiners
  board         jsonb,                             -- current Excalidraw elements snapshot
  board_view    text not null default 'deck'       -- which panel is live: 'deck' | 'board'
                check (board_view in ('deck','board')),
  created_by    uuid not null references auth.users default auth.uid(),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz
);

-- One row per join event (honest reconnect log). Live roster comes from presence.
-- email is denormalized so the admin report can name students without a service-role
-- key (auth.users.email isn't readable by the anon client).
create table public.session_participants (
  id         bigint generated always as identity primary key,
  session_id uuid not null references public.sessions on delete cascade,
  user_id    uuid not null references auth.users default auth.uid(),
  email      text,
  joined_at  timestamptz not null default now(),
  left_at    timestamptz
);

-- The scorable set for a session. Activity components self-register here when the
-- presenter deck mounts (every reveal section mounts at once), so we never parse MDX.
-- phase/ends_at/results drive the live idle->running->ended lifecycle: late joiners
-- catch up to the live state, and the presenter freezes the final tally in `results`
-- on end() so learners (who can only read their OWN responses via RLS) can still
-- render the distribution chart.
create table public.session_activities (
  session_id  uuid not null references public.sessions on delete cascade,
  activity_id text not null,
  type        text not null check (type in ('quiz','poll','dragdrop')),
  correct     jsonb,                              -- null for poll (no right answer)
  phase       text not null default 'idle' check (phase in ('idle','running','ended')),
  ends_at     timestamptz,                        -- absolute end instant; clients derive countdown
  results     jsonb,                              -- frozen final tally (number[]), written on end
  primary key (session_id, activity_id)
);

-- One locked-in answer per student per activity.
create table public.responses (
  session_id  uuid not null references public.sessions on delete cascade,
  activity_id text not null,
  user_id     uuid not null references auth.users default auth.uid(),
  response    jsonb not null,                     -- self-contained: pick/order + label
  is_correct  boolean,                            -- null for poll
  created_at  timestamptz not null default now(),
  primary key (session_id, activity_id, user_id)  -- second submit is rejected
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.articles             enable row level security;
alter table public.courses              enable row level security;
alter table public.sessions             enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_activities   enable row level security;
alter table public.responses            enable row level security;

-- profiles: a user may read their own row (for UI role checks)
create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

-- articles / courses: users see published; admins see/write everything
create policy "read published or admin" on public.articles
  for select using (status = 'published' or public.is_admin());
create policy "admin writes" on public.articles
  for all using (public.is_admin()) with check (public.is_admin());
create policy "read published or admin" on public.courses
  for select using (status = 'published' or public.is_admin());
create policy "admin writes" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

-- sessions: readable if live (to join by code), if you participated (history), or admin.
create policy "read live, participated, or admin" on public.sessions
  for select using (
    status = 'live'
    or public.is_admin()
    or exists (select 1 from public.session_participants p
               where p.session_id = sessions.id and p.user_id = auth.uid())
  );
create policy "admin writes sessions" on public.sessions
  for all using (public.is_admin()) with check (public.is_admin());

-- participants: a user logs/updates their own row against a live session; admins read all.
create policy "join live" on public.session_participants
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.sessions s
                where s.id = session_id and s.status = 'live'));
create policy "read own participation or admin" on public.session_participants
  for select using (user_id = auth.uid() or public.is_admin());
create policy "update own participation" on public.session_participants
  for update using (user_id = auth.uid());

-- session_activities: presenter (admin) writes; readable by any signed-in user
-- (answer keys already ship in the MDX client bundle).
create policy "admin writes activities" on public.session_activities
  for all using (public.is_admin()) with check (public.is_admin());
create policy "read activities" on public.session_activities
  for select using (auth.uid() is not null);

-- responses: a user inserts their own against a live session; no update (locked in);
-- a user reads only their own, admins read all (for the report).
create policy "answer live" on public.responses
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.sessions s
                where s.id = session_id and s.status = 'live'));
create policy "read own responses or admin" on public.responses
  for select using (user_id = auth.uid() or public.is_admin());

-- ── Realtime authz ─────────────────────────────────────────────────────────
-- All three channels open as private ({ config: { private: true } }), so Realtime
-- enforces RLS on realtime.messages instead of letting any client with the anon key
-- + session id subscribe and broadcast.
-- Channel topics: session:<id>  /  session:<id>:nav  /  session:<id>:board  /  session:<id>:phase
--   :nav   — presenter drives slide nav + "ended"; viewers only read
--   :board — presenter drives whiteboard + view toggle; viewers only read
--   :phase — presenter drives activity idle->running->ended; viewers only read
--   base   — answer-count broadcasts + presence roster (participants read/write)
-- realtime.messages already has RLS enabled by Supabase; we only add policies.

-- The session id embedded in the current channel topic (null if not a session topic).
create function public.realtime_session_id() returns uuid
  language sql stable set search_path = '' as $$
  select case
    when realtime.topic() ~ '^session:[0-9a-f-]{36}'
    then split_part(realtime.topic(), ':', 2)::uuid
  end;
$$;

-- True for the presenter-only control channels (:nav, :board, :phase).
create function public.realtime_is_control_topic() returns boolean
  language sql stable set search_path = '' as $$
  select realtime.topic() ~ ':(nav|board|phase)$';
$$;

-- READ (receive broadcast + presence): admin, the session owner, or a participant.
create policy "session realtime read" on realtime.messages
  for select to authenticated
  using (
    public.realtime_session_id() is not null
    and (
      public.is_admin()
      or exists (select 1 from public.sessions s
                 where s.id = public.realtime_session_id() and s.created_by = auth.uid())
      or exists (select 1 from public.session_participants p
                 where p.session_id = public.realtime_session_id() and p.user_id = auth.uid())
    )
  );

-- WRITE (send broadcast + track presence): admin/owner anywhere; participants only on
-- the base topic (answer counts + presence). ponytail: base broadcasts stay open to
-- participants — those counts are cosmetic (seeded/scored from the responses table via
-- RLS, not from broadcasts). The disruption vectors (fake nav / "ended" / whiteboard /
-- phase) live on the control topics, owner-only.
create policy "session realtime write" on realtime.messages
  for insert to authenticated
  with check (
    public.realtime_session_id() is not null
    and (
      public.is_admin()
      or exists (select 1 from public.sessions s
                 where s.id = public.realtime_session_id() and s.created_by = auth.uid())
      or (
        not public.realtime_is_control_topic()
        and exists (select 1 from public.session_participants p
                    where p.session_id = public.realtime_session_id() and p.user_id = auth.uid())
      )
    )
  );

-- ── Seeds ──────────────────────────────────────────────────────────────────
-- One row per disk article (src/content/articles/*.mdx) + the example course.
insert into public.articles (slug, status) values
  ('intro', 'published'),
  ('rag', 'draft'),
  ('what-is-ai', 'draft'),
  ('agentic-coding', 'published')
  on conflict do nothing;
insert into public.courses (slug, status) values ('intro-to-ai', 'published')
  on conflict do nothing;

-- Bootstrap the first admin (replace the email):
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'YOUR_EMAIL');
