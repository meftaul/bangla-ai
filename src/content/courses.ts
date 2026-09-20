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
  {
    slug: "math_for_ai",
    title: "Math for AI",
    description: "The maths under the hood, from first principles — starting with what an image actually is.",
    items: [
      "math_for_ai/01_intro",
      "math_for_ai/01c_image_numbers",
      "math_for_ai/01d_color_image",
      "math_for_ai/01e_vector",
      "math_for_ai/01f_representation",
      "math_for_ai/01a_graph_paper",
      "math_for_ai/01b_binary",
      "math_for_ai/02a_vector_list",
      "math_for_ai/02b_vector_arrow",
      "math_for_ai/02c_king_queen",
      "math_for_ai/02d_real_arrows",
      "math_for_ai/02e_high_dimension",
      "math_for_ai/02f_hospital_dimension",
      "math_for_ai/02g_three_surprises",
      "math_for_ai/02h_model_vectors",
      "math_for_ai/03a_treasure_add",
      "math_for_ai/03b_sherbet_stretch",
      "math_for_ai/03c_tiffin_recipe",
      "math_for_ai/03d_norm_length",
      "math_for_ai/03e_crow_king",
      "math_for_ai/03f_unit_vector",
      "math_for_ai/03g_grams_trap",
      "math_for_ai/04a_haat_dot",
      "math_for_ai/04b_van_push",
      "math_for_ai/04c_noon_shadow",
      "math_for_ai/04d_cosine_movie",
      "math_for_ai/04e_tow_rope",
      "math_for_ai/04f_library_search",
      "math_for_ai/05a_remote_span",
    ],
  },
];
