-- Rows for the LLM + Deep Learning courses added to src/content/courses.ts, and
-- their first lessons. Draft: the lessons are outlines, publish from
-- /dashboard/articles/manage once written.
insert into public.courses (slug, status) values
  ('llm', 'draft'),
  ('deep-learning', 'draft')
  on conflict do nothing;

insert into public.articles (slug, status) values
  ('llm/01-what-is-llm', 'draft'),
  ('deep-learning/01-intro-to-dl', 'draft')
  on conflict do nothing;

-- Debris from local experimentation. Safe: 'random-article' was type article, so it
-- was never session material and nothing in public.sessions references it.
delete from public.articles where slug = 'random-article';
delete from public.courses  where slug = 'dl';
