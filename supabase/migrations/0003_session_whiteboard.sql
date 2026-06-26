-- Live whiteboard: the presenter can switch a live session between the slide deck and
-- a full Excalidraw board; students follow (view-only). The current scene is persisted
-- so late joiners catch up — same shape as current_slide. Run by hand in the Supabase
-- SQL editor (no service-role key / CLI). Builds on 0002 (sessions + RLS already cover
-- these columns: "admin writes sessions" persists, "read live or admin" reads).

alter table public.sessions
  add column board      jsonb,                       -- current Excalidraw elements snapshot
  add column board_view text not null default 'deck' -- which panel is live: 'deck' | 'board'
    check (board_view in ('deck','board'));
