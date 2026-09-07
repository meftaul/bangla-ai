// Courses are pure groupings: title + description + an ordered list of member
// slugs (articles or slides). The DB `courses` table holds only mutable status;
// THIS file is the source of truth for which courses exist and what they contain
// — mirroring how the MDX files are the source of truth for articles/slides.
//
// ponytail: a single typed module avoids a glob + an array-aware MDX parser the
// `readMeta` regex in articles.ts can't do. Split into src/content/courses/*.ts
// if this list ever gets long.

export type Course = {
  slug: string;
  title: string;
  description: string;
  items: string[];
};

export const COURSES: Course[] = [
  {
    slug: "intro-to-ai",
    title: "Intro to AI",
    description: "Start here — what AI is, a live intro deck, and RAG.",
    items: ["what-is-ai", "rag"],
  },
  {
    slug: "llm",
    title: "Intro to LLMs",
    description: "What large language models are, how they work, and where they fail.",
    items: ["llm/01-what-is-llm"],
  },
  {
    // Slug matches the src/content/articles/ folder its items live in.
    slug: "deep-learning",
    title: "Intro to Deep Learning",
    description: "Neural networks from first principles — layers, training, and real uses.",
    items: ["deep-learning/01-intro-to-dl"],
  },
];
