-- Let students see their own past sessions. The 0002 read policy only exposed
-- live sessions to non-admins, so an ended session a student attended became
-- unreadable — blocking a "my sessions" history. Widen the read policy to also
-- allow any session the user has a participant row for. Superset of the old
-- policy: live-by-code join and all admin reads keep working.
-- Run by hand in the Supabase SQL editor (no service-role key / CLI), like 0002.

drop policy "read live or admin" on public.sessions;

create policy "read live, participated, or admin" on public.sessions
  for select using (
    status = 'live'
    or public.is_admin()
    or exists (
      select 1 from public.session_participants p
      where p.session_id = sessions.id and p.user_id = auth.uid()
    )
  );
