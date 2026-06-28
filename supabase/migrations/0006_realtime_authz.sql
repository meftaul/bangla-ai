-- Authorize Realtime channels for live sessions. The client now opens all three
-- channels as private ({ config: { private: true } }), so Realtime enforces RLS on
-- realtime.messages instead of letting any client with the anon key + session id
-- subscribe and broadcast. Run by hand in the Supabase SQL editor (no CLI).
--
-- Channel topics: session:<id>  /  session:<id>:nav  /  session:<id>:board
--   :nav   — presenter drives slide nav + "ended"; viewers only read
--   :board — presenter drives whiteboard + view toggle; viewers only read
--   base   — answer-count broadcasts + presence roster (participants read/write)
--
-- realtime.messages already has RLS enabled by Supabase; we only add policies.

-- The session id embedded in the current channel topic (null if not a session topic).
create function public.realtime_session_id() returns uuid
  language sql stable set search_path = '' as $$
  select case
    when realtime.topic() ~ '^session:[0-9a-f-]{36}'
    then split_part(realtime.topic(), ':', 2)::uuid
  end;
$$;

-- True for the presenter-only control channels (:nav, :board).
create function public.realtime_is_control_topic() returns boolean
  language sql stable set search_path = '' as $$
  select realtime.topic() ~ ':(nav|board)$';
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
-- RLS, not from broadcasts). The disruption vectors (fake nav / "ended" / whiteboard)
-- live on the control topics, now owner-only.
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
