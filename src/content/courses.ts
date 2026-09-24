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
      "math_for_ai/01b2_binary_drums",
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
      "math_for_ai/04a0_nasib_rule",
      "math_for_ai/04a_haat_dot",
      "math_for_ai/04b_van_push",
      "math_for_ai/04c_noon_shadow",
      "math_for_ai/04c1_mamas_card",
      "math_for_ai/04c1d_rolling_van",
      "math_for_ai/04c2_axis_shadow",
      "math_for_ai/04d_cosine_movie",
      "math_for_ai/04e_tow_rope",
      "math_for_ai/04e2_bent_river",
      "math_for_ai/04f_library_search",
      "math_for_ai/04f1_million_books",
      "math_for_ai/04f2_attention_box",
      "math_for_ai/05a_remote_span",
      "math_for_ai/05a2_weak_battery",
      "math_for_ai/05b_extra_column",
      "math_for_ai/05b2_walk_home",
      "math_for_ai/05c_moving_basis",
      "math_for_ai/05d_flat_sheet",
      "math_for_ai/05e_school_lanes",
      "math_for_ai/05e2_two_cards",
      "math_for_ai/05f_rooftop_rent",
      "math_for_ai/05f2_fair_grid",
      "math_for_ai/06a_team_register",
      "math_for_ai/06b_road_alpana",
      "math_for_ai/06c_two_ropes",
      "math_for_ai/06d_sir_notebook",
      "math_for_ai/06e_flat_crossing",
      "math_for_ai/06f_club_machine",
      "math_for_ai/06g_arrow_or_paper",
      "math_for_ai/07a_bazar_list",
      "math_for_ai/07b_light_wall",
      "math_for_ai/07c_two_lenses",
      "math_for_ai/07d_holud_order",
      "math_for_ai/07e_photo_album",
      "math_for_ai/07f_nanar_gamcha",
      "math_for_ai/08a_rong_kouta",
      "math_for_ai/08b_amin_jomi",
      "math_for_ai/08c_mehedi_flip",
      "math_for_ai/08d_lens_box",
      "math_for_ai/08e_lens_stack",
      "math_for_ai/08f_dhaner_katha",
      "math_for_ai/08g_alo_fike",
    ],
  },
  {
    slug: "calculus_for_ai",
    title: "Calculus for AI",
    description: "Slopes, limits, integrals and gradients, told through a honey year in a mustard village, up to the network that sorts the hives.",
    items: ["calculus_for_ai/01a_bee_route"],
  },
];
