-- Live sessions: an admin runs an article as a live, slide-synced session;
-- logged-in users join with a code; their activity responses are saved; scores
-- are revealed after the session ends. Run by hand in the Supabase SQL editor
-- (no service-role key / CLI). Builds on 0001 (profiles, is_admin(), articles).

-- One row per run of an article. Same article can be run many times (history).
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null references public.articles(slug),
  join_code     text not null unique,
  status        text not null default 'live' check (status in ('live','ended')),
  current_slide int  not null default 0,         -- presenter's slide, for late joiners
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
create table public.session_activities (
  session_id  uuid not null references public.sessions on delete cascade,
  activity_id text not null,
  type        text not null check (type in ('quiz','poll','dragdrop')),
  correct     jsonb,                              -- null for poll (no right answer)
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

alter table public.sessions             enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_activities   enable row level security;
alter table public.responses            enable row level security;

-- sessions: anyone signed in can read a live session (to join by code); admins own writes.
create policy "read live or admin" on public.sessions
  for select using (status = 'live' or public.is_admin());
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
