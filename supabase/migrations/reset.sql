-- Nuke everything 0001_init.sql created, so you can re-run it clean.
-- Run by hand in the Supabase SQL editor. Does NOT touch auth.users.

-- realtime.messages isn't ours to drop — just remove our policies.
drop policy if exists "session realtime read"  on realtime.messages;
drop policy if exists "session realtime write" on realtime.messages;

-- our tables (cascade clears FKs, policies, the identity seq, etc.)
drop table if exists public.responses            cascade;
drop table if exists public.session_activities   cascade;
drop table if exists public.session_participants cascade;
drop table if exists public.sessions             cascade;
drop table if exists public.courses              cascade;
drop table if exists public.articles             cascade;
drop table if exists public.profiles             cascade;

-- trigger on auth.users + functions
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.realtime_session_id() cascade;
drop function if exists public.realtime_is_control_topic() cascade;
