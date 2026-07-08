-- Fix Supabase linter 0028/0029: SECURITY DEFINER functions exposed via REST RPC.
-- Run by hand in the Supabase SQL editor. Both statements are idempotent.

-- handle_new_user(): keep SECURITY DEFINER (the trigger fires as supabase_auth_admin,
-- which can't INSERT into public.profiles on its own), but it's a trigger fn only and
-- should never be a real /rest/v1/rpc call. Triggers check EXECUTE at creation time,
-- not at fire time, and the trigger already exists — so this does NOT break signup.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_admin(): called inside RLS policies (evaluated as the querying role), so we can't
-- revoke EXECUTE without breaking every admin path. The lint only flags SECURITY
-- DEFINER, so drop it -> SECURITY INVOKER. Behavior is identical: is_admin only reads
-- the caller's OWN profile row (id = auth.uid()), which the "read own profile" RLS
-- policy already permits. CREATE OR REPLACE resets it to invoker; PUBLIC keeps EXECUTE.
create or replace function public.is_admin() returns boolean
  language sql stable set search_path = '' as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin');
$$;
