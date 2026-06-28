-- Live activity phases: a teacher drives each quiz/poll/dragdrop through
-- idle -> running -> ended with a 30s countdown, then a results bar chart.
-- Run by hand in the Supabase SQL editor. Builds on 0002 (session_activities).
--
-- Why these columns live on session_activities (admin-write, all-read RLS):
--   phase/ends_at  -> late joiners & refreshes catch up to the live state.
--   results        -> learners can only read their OWN responses (RLS), so they
--                     can't rebuild the distribution chart; the presenter freezes
--                     the final tally here on end() and everyone reads it.
alter table public.session_activities
  add column phase   text not null default 'idle'
    check (phase in ('idle','running','ended')),
  add column ends_at timestamptz,   -- absolute end instant; clients derive the countdown
  add column results jsonb;         -- frozen final tally (number[]), written on end

-- Phase changes broadcast on a new presenter-only topic, session:<id>:phase. It can't
-- reuse :nav (one socket can't join a topic twice -> breaks slide sync). Add :phase to
-- the control-topic set so only the owner/admin can write it; participants only read.
create or replace function public.realtime_is_control_topic() returns boolean
  language sql stable set search_path = '' as $$
  select realtime.topic() ~ ':(nav|board|phase)$';
$$;
