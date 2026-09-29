// The Math for AI course as a railway (see src/components/rail/). Each chapter
// is a line with its own named train; each journey is the station you ride to,
// named after its story, and the tool the station hands you on arrival. At the
// end of a line the line's tools assemble into its machine.
//
// Keyed by article slug, in the course's order (src/content/courses.ts decides
// which journeys exist and in what order; a slug missing here just isn't a
// station). Only published journeys ride: railNet() builds the network from the
// stations that are open, so a draft is off the map, off every ticket and out
// of its line's tools until it is published. Station names are the story's own places, in Bangla, with an
// English reading and a three-letter code for the ticket.
//
// ponytail: only Line 1 runs for now (MATH_RAIL below); lines 2–10 wait in
// LINES with their names and tools, and join by widening the slice.
//
// ponytail: only Math for AI rides the rail. Another course joins by getting its
// own RailNetwork here and a branch in dashboard/courses/[slug]/page.tsx.

import type { Icon } from "@phosphor-icons/react";
import {
  AddressBook,
  Angle,
  Aperture,
  ArrowBendUpRight,
  ArrowCounterClockwise,
  ArrowsClockwise,
  ArrowsCounterClockwise,
  ArrowsIn,
  ArrowsLeftRight,
  ArrowsOut,
  ArrowUpRight,
  Basket,
  BatteryLow,
  Binary,
  Bird,
  Boat,
  BowlFood,
  Books,
  Buildings,
  Camera,
  Cards,
  ChartLine,
  Checkerboard,
  Columns,
  Compass,
  CookingPot,
  Cpu,
  Crown,
  Cube,
  EyeSlash,
  Eyeglasses,
  Flashlight,
  FlowerLotus,
  Footprints,
  Funnel,
  Gauge,
  Grains,
  GridFour,
  HandPalm,
  Heart,
  Key,
  Lamp,
  Lightbulb,
  LineSegments,
  ListNumbers,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  NavigationArrow,
  Notebook,
  Package,
  PaintBrush,
  PaintBucket,
  Phone,
  Plant,
  PlusMinus,
  Radio,
  Receipt,
  Ruler,
  Scales,
  Scissors,
  ShoppingCart,
  Sigma,
  Sparkle,
  SquaresFour,
  Stack,
  Stamp,
  Sun,
  SunDim,
  Swap,
  Table,
  Television,
  Triangle,
  Trophy,
  Wind,
} from "@phosphor-icons/react/dist/ssr";

export type Tool = {
  name: string;
  /** what the tool does, in one line: the journey's "aha" as something you can hold */
  does: string;
  icon: Icon;
};

/** A question of the station's own, for its hawker (see rail/hawker.tsx); `answer` indexes `options`. */
export type Recall = { q: string; options: string[]; answer: number };

export type Station = {
  slug: string;
  /** three letters, for boards and tickets */
  code: string;
  bn: string;
  en: string;
  tool: Tool;
  /** the hawker's question here; without one he asks which idea this station gave */
  recall?: Recall;
};

export type Line = {
  id: string;
  /** chapter number */
  no: number;
  train: { bn: string; en: string; no: number };
  topic: string;
  machine: { name: string; does: string };
  stations: Station[];
};

const s = (slug: string, code: string, bn: string, en: string, name: string, does: string, icon: Icon): Station => ({
  slug: `math_for_ai/${slug}`,
  code,
  bn,
  en,
  tool: { name, does, icon },
});

const LINES: Line[] = [
  {
    id: "l1",
    no: 1,
    train: { bn: "ছবি মেইল", en: "Chhobi Mail", no: 701 },
    topic: "Pictures, colours and things as numbers",
    machine: { name: "Picture phone", does: "Sends anything, a photo, a colour, even an email, down the line as a list of numbers." },
    stations: [
      s("00_why_math", "PKH", "পাখির খোঁজ", "Pakhir Khoj", "Multiply-add counter", "Finds a bird among 4,000 photos with nothing but multiplying and adding.", Bird),
      s("01_intro", "CBG", "ছবিঘর", "Chhobighar", "Pixel loupe", "Reads a photo as a grid of brightness numbers.", MagnifyingGlass),
      s("01c_image_numbers", "BTF", "বাটন ফোন", "Button Phone", "Grid call code", "Reads a drawing aloud, square by square, as numbers.", Phone),
      s("01d_color_image", "RFK", "রাফির খাতা", "Rafir Khata", "Three-lamp mixer", "Any colour as three numbers: red, green, blue.", Lightbulb),
      s("01e_vector", "PTM", "পিটি মাঠ", "PT Math", "Measuring list", "A person as an ordered list of measurements: a vector.", Ruler),
      s("01f_representation", "AIB", "আম্মুর ইনবক্স", "Ammur Inbox", "Feature sieve", "Turns things with no numbers in them into numbers.", Funnel),
      s("01a_graph_paper", "KHG", "খালি ঘর", "Khali Ghor", "Two-number address", "Any spot in the room as (x, y).", GridFour),
      s("01b_binary", "BSB", "বাঁশের বাল্ব", "Basher Balb", "Priced-bulb scoreboard", "Reads a score off bulbs priced 1, 2, 4, 8, 16.", Binary),
    ],
  },
  {
    id: "l2",
    no: 2,
    train: { bn: "তীর এক্সপ্রেস", en: "Teer Express", no: 702 },
    topic: "Vectors as lists and as arrows",
    machine: { name: "Word compass", does: "Finds a word by walking arrows: king − man + woman lands near queen." },
    stations: [
      s("02a_vector_list", "SMF", "সামিনের ফাইল", "Saminer File", "Order lock", "Keeps every number in its own slot, in the same order.", ListNumbers),
      s("02b_vector_arrow", "SKK", "শিকুর কাগজ", "Shikur Kagoj", "Loose arrow", "The same vector, wherever you put it on the paper.", ArrowUpRight),
      s("02c_king_queen", "CHD", "চায়ের দোকান", "Chayer Dokan", "Arrow shifter", "Lifts an arrow and sets it down somewhere else.", Crown),
      s("02d_real_arrows", "MJG", "মাঝির ঘাট", "Majhir Ghat", "Wind vane", "Tells real arrows from ones we chose to draw as arrows.", Wind),
      s("02e_high_dimension", "DZD", "দর্জির দোকান", "Dorjir Dokan", "Tile Pythagoras", "Distance, however many directions there are.", Triangle),
      s("02f_hospital_dimension", "HSP", "হাসপাতাল", "Haspatal", "Σ counter", "Adds up a long list in one sign.", Sigma),
      s("02g_three_surprises", "LDC", "লুডুর ছক", "Ludur Chhok", "Cube peeler", "Shows that in many dimensions, nearly everything is skin.", Cube),
      s("02h_model_vectors", "NNR", "নানুর রেডিও", "Nanur Radio", "Radio knob", "A model learns by turning its knobs downhill.", Radio),
    ],
  },
  {
    id: "l3",
    no: 3,
    train: { bn: "মেলা কমিউটার", en: "Mela Commuter", no: 703 },
    topic: "Adding, stretching and measuring vectors",
    machine: { name: "Fair judge", does: "Compares any two cards fairly: by size, by direction, in any units." },
    stations: [
      s("03a_treasure_add", "BGM", "বিজ্ঞান মেলা", "Biggan Mela", "Clue joiner", "Adds and subtracts arrows, tip to tail.", MapTrifold),
      s("03b_sherbet_stretch", "SRB", "শরবতের স্টল", "Shorboter Stall", "Stretch dial", "Multiplies a whole card by one number.", ArrowsOut),
      s("03c_tiffin_recipe", "TFB", "টিফিন বক্স", "Tiffin Box", "Recipe mixer", "Builds new cards out of adding and stretching.", BowlFood),
      s("03d_norm_length", "FNM", "ফাইনাল মঞ্চ", "Final Moncho", "Length tape", "‖v‖: how long an arrow is.", Trophy),
      s("03e_crow_king", "FHS", "ফাহিমের স্টল", "Fahimer Stall", "Three rulers", "The crow's, the walker's and the chess king's distance.", Bird),
      s("03f_unit_vector", "MVC", "মুভি ক্লাব", "Movie Club", "Direction card", "Shrinks any arrow to length 1, keeping only its direction.", NavigationArrow),
      s("03g_grams_trap", "DAS", "ডাক্তার আপার স্টল", "Daktar Apar Stall", "Unit balance", "Puts every column on the same scale before comparing.", Scales),
    ],
  },
  {
    id: "l4",
    no: 4,
    train: { bn: "বিন্দু এক্সপ্রেস", en: "Bindu Express", no: 704 },
    topic: "The dot product, from the haat to ChatGPT",
    machine: { name: "Tiny search box", does: "Finds the library card that points the same way as your question." },
    stations: [
      s("04a0_nasib_rule", "NSB", "নাসিবের মোড়", "Nasiber Mor", "Rule card", "Why you multiply slot by slot, then add.", Cards),
      s("04a_haat_dot", "HAT", "হাট", "Haat", "Daripalla", "One number from two cards: the dot product.", Basket),
      s("04b_van_push", "KDP", "কাদাপাড়া", "Kadapara", "For-or-against sign", "The dot product's sign says whether a push helps.", PlusMinus),
      s("04c_noon_shadow", "DPC", "দুপুরের ছাদ", "Dupurer Chhad", "Noon stick", "The dot product from a shadow: length × shadow.", Sun),
      s("04c1_mamas_card", "MMA", "মামার মোড়", "Mamar Mor", "Angle card", "The dot product from two lengths and one angle.", Angle),
      s("04c1d_rolling_van", "SKR", "শুকনা রাস্তা", "Shukna Rasta", "Work meter", "Measures how much of a push goes along the road.", Gauge),
      s("04c2_axis_shadow", "CHY", "ছায়াবাড়ি", "Chhayabari", "Axis lamp", "Why the two ways of working it out always agree.", Lamp),
      s("04d_cosine_movie", "CIN", "সিনেমা হল", "Cinema Hall", "Taste compass", "How alike two tastes are, however much each person watches.", Compass),
      s("04e_tow_rope", "NDG", "নদীঘাট", "Nodighat", "Tow rope", "Splits a pull into the part that works and the part that's wasted.", Boat),
      s("04e2_bent_river", "BNK", "বাঁকা নদী", "Banka Nodi", "Bend cutter", "The shadow on any direction, not just an axis.", ArrowBendUpRight),
      s("04f_library_search", "PTG", "পাঠাগার", "Pathagar", "Index cards", "When to search by dot product, and when by cosine.", Books),
      s("04f1_million_books", "LKB", "লাখ বই ", "Lakhboi", "Normalise stamp", "Divide once, and every search after is a plain dot product.", Stamp),
      s("04f2_attention_box", "MNJ", "মনোযোগ জংশন", "Monojog Junction", "Attention lens", "The same dot product, deciding what ChatGPT looks at.", Sparkle),
    ],
  },
  {
    id: "l5",
    no: 5,
    train: { bn: "নাগাল ইন্টারসিটি", en: "Nagal Intercity", no: 705 },
    topic: "Span, basis and dimension",
    machine: { name: "Address machine", does: "Writes any point in any set of buttons, and spots a button you don't need." },
    stations: [
      s("05a_remote_span", "NTB", "নতুন বাসা", "Notun Basa", "Reach map", "Everywhere a set of buttons can take you: the span.", Television),
      s("05a2_weak_battery", "BTD", "ব্যাটারির দোকান", "Batterir Dokan", "Press counter", "How many presses of each button reach a spot.", BatteryLow),
      s("05b_extra_column", "BHB", "ভাড়া বাসা", "Bhara Basa", "Extra-column finder", "Spots a column the others already make.", Columns),
      s("05b2_walk_home", "BRP", "বাড়ির পথ", "Barir Poth", "Spare-button catcher", "Catches a button that adds no new direction.", Footprints),
      s("05c_moving_basis", "BTB", "বোতামের বাক্স", "Botamer Baksho", "Fewest buttons", "A basis, and its size: the dimension.", SquaresFour),
      s("05d_flat_sheet", "KTP", "খাতার পাতা", "Khatar Pata", "Flat-sheet finder", "Finds the smaller sheet the data really lives on.", Notebook),
      s("05e_school_lanes", "SCG", "স্কুলের গলি", "Schooler Goli", "Rickshaw card", "A place written in the lanes' own steps.", MapPin),
      s("05e2_two_cards", "DCM", "দুই কার্ডের মোড়", "Dui Carder Mor", "Card translator", "The same arrow, new numbers.", ArrowsLeftRight),
      s("05f_rooftop_rent", "CDF", "ছাদের ফ্ল্যাট", "Chhader Flat", "Rent grid", "Picks the axes that make the numbers mean something.", Buildings),
      s("05f2_fair_grid", "GRG", "ঘোরানো গ্রিড", "Ghorano Grid", "Turn-proof ruler", "What stays true when the grid turns.", ArrowsClockwise),
    ],
  },
  {
    id: "l6",
    no: 6,
    train: { bn: "আলপনা এক্সপ্রেস", en: "Alpona Express", no: 706 },
    topic: "Matrices as moves",
    machine: { name: "Alpana machine", does: "Moves a whole drawing, every point at once, with one small table." },
    stations: [
      s("06a_team_register", "CLB", "ক্লাবঘর", "Clubghor", "Register frame", "A table of numbers that is one thing: a matrix.", Table),
      s("06b_road_alpana", "ALR", "আলপনার রাস্তা", "Alponar Rasta", "Grid mover", "A linear move keeps lines straight and the centre still.", FlowerLotus),
      s("06c_two_ropes", "DDR", "দুই দড়ি", "Dui Dori", "Two rope marks", "Where two arrows land decides where everything lands.", LineSegments),
      s("06d_sir_notebook", "ASK", "আর্ট স্যারের খাতা", "Art Sirer Khata", "Column reader", "Reads the picture straight from four numbers.", PaintBrush),
      s("06e_flat_crossing", "PCM", "পাঁচ মোড়", "Pach Mor", "Flat check", "Which moves come back to paper and which squash it.", ArrowsIn),
      s("06f_club_machine", "CBM", "ক্লাবের মেশিন", "Club er Machine", "Matrix test", "Which rules a matrix can run.", Cpu),
      s("06g_arrow_or_paper", "FHM", "ফাহিমের ম্যাপ", "Fahimer Map", "Arrow-or-paper lens", "Did the arrow move, or did the paper change?", MapTrifold),
    ],
  },
  {
    id: "l7",
    no: 7,
    train: { bn: "বিয়েবাড়ি মেইল", en: "Biyebari Mail", no: 707 },
    topic: "Multiplying matrices",
    machine: { name: "Filter stack", does: "Runs fifty photo filters as one matrix." },
    stations: [
      s("07a_bazar_list", "BZR", "বাজার", "Bazar", "Two-way counter", "Ax worked out by rows or by columns, same answer.", ShoppingCart),
      s("07b_light_wall", "DYA", "দেয়ালের আলো", "Deyaler Alo", "Knob reach", "Where Ax can land: the column space.", Flashlight),
      s("07c_two_lenses", "LBJ", "লাইট ভাইয়ের যন্ত্র", "Light Bhaiyer Jontro", "Lens joiner", "Two lenses in a row as one lens: AB.", Aperture),
      s("07d_holud_order", "HLR", "হলুদের রাত", "Holuder Rat", "Order tag", "AB and BA are not the same picture.", ArrowsCounterClockwise),
      s("07e_photo_album", "PHA", "ফটো অ্যালবাম", "Photo Album", "Filter squeezer", "Fifty filters multiplied into one.", Camera),
      s("07f_nanar_gamcha", "NNT", "নানার তাঁত", "Nanar Tant", "Loom check", "One thread times another fills a whole grid.", Checkerboard),
    ],
  },
  {
    id: "l8",
    no: 8,
    train: { bn: "কৌটা এক্সপ্রেস", en: "Kouta Express", no: 708 },
    topic: "The determinant",
    machine: { name: "Paint reckoner", does: "Says how many tins of paint any lens needs, flips and squashes included." },
    stations: [
      s("08a_rong_kouta", "RGD", "রঙের দোকান", "Ronger Dokan", "Kouta counter", "How many times the area grows: the determinant.", PaintBucket),
      s("08b_amin_jomi", "AMJ", "আমিনের জমি", "Aminer Jomi", "Amin's chain", "ad − bc for a slanted plot.", Plant),
      s("08c_mehedi_flip", "MHR", "মেহেদির রাত", "Mehedir Rat", "Mirror sign", "A minus determinant means the picture flipped.", HandPalm),
      s("08d_lens_box", "PKP", "পুকুরপাড়", "Pukurpar", "Squash detector", "Determinant zero: the lens flattens everything.", Package),
      s("08e_lens_stack", "DRU", "দরজার উপর", "Dorjar Upor", "Area multiplier", "Stack lenses and their determinants multiply.", Stack),
      s("08f_dhaner_katha", "PKA", "পাইকারের আড়ত", "Paikarer Arot", "Box walker", "A 3 × 3 determinant, walking the top row.", Grains),
      s("08g_alo_fike", "PHR", "ফিরানির রাত", "Phiranir Rat", "Light spreader", "Spread over more area, each square gets dimmer.", SunDim),
    ],
  },
  {
    id: "l9",
    no: 9,
    train: { bn: "ফেরা মেইল", en: "Phera Mail", no: 709 },
    topic: "The inverse",
    machine: { name: "Undo machine", does: "Brings any picture back, and warns when bringing it back isn't safe." },
    stations: [
      s("09a_ferar_lens", "BRR", "বৃষ্টির রাত", "Brishtir Rat", "Return lens", "G⁻¹, the lens that undoes G.", ArrowCounterClockwise),
      s("09b_somer_niyom", "SMK", "সোমের খাতা", "Somer Khata", "Swap-and-flip rule", "A 2 × 2 inverse from four numbers at a glance.", Swap),
      s("09c_apar_trunk", "APT", "আপার ট্রাংক", "Apar Trunk", "Last-off-first key", "Undo lenses in the reverse order they went on.", Key),
      s("09d_thikana_card", "DBG", "দুলাভাইয়ের গ্রাম", "Dulabhaiyer Gram", "Address card", "An inverse worked out once gives everyone's card.", AddressBook),
      s("09e_jhapsa_lens", "BDY", "বিদায়", "Biday", "Ridge brace", "+λI steadies a nearly flat lens.", Eyeglasses),
    ],
  },
  {
    id: "l10",
    no: 10,
    train: { bn: "রসিদ এক্সপ্রেস", en: "Roshid Express", no: 710 },
    topic: "Solving systems, and least squares",
    machine: { name: "Fair-fare finder", does: "Finds prices from receipts, even when the receipts don't quite agree." },
    stations: [
      s("10a_bhija_khata", "BJK", "ভেজা খাতা", "Bhija Khata", "Receipt pair test", "Which two receipts actually give a price.", Receipt),
      s("10b_moyrar_rosid", "MYD", "ময়রার দোকান", "Moyrar Dokan", "Pot-count check", "The determinant says one answer, before the totals come.", CookingPot),
      s("10c_rosid_kata", "CHB", "চেয়ার ভাড়া", "Chair Bhara", "Receipt cutter", "Cancels one receipt with another: elimination.", Scissors),
      s("10d_kouta_thikana", "STC", "স্টেনসিল কার্ড", "Stencil Card", "Kouta address", "Finds the spot by counting tins: Cramer's rule.", Heart),
      s("10e_borhani_andha", "BBD", "বাবুর্চির ডেরা", "Baburchir Dera", "Blind-spot finder", "Receipts that add no new price: the rank.", EyeSlash),
      s("10f_vanwalar_bhara", "BST", "বাসস্ট্যান্ড", "Bus Stand", "Least-gap line", "The line with the smallest total miss: least squares.", ChartLine),
    ],
  },
];

export const MATH_RAIL: Line[] = LINES.slice(0, 1);

/** Course slug → its railway. Only Math for AI for now. */
export const RAIL: Record<string, Line[]> = { math_for_ai: MATH_RAIL };

/** Every slug with a station on the network, published or not. */
export const RAIL_SLUGS: string[] = MATH_RAIL.flatMap((line) => line.stations.map((st) => st.slug));

/** Every station in riding order, with its line, its number on the line (1…) and its place on the whole network. */
export type Stop = Station & { line: Line; n: number; index: number };

export type RailNet = {
  /** the lines, each holding only its open stations; a line with none is gone */
  lines: Line[];
  stopOf: (slug: string) => Stop | undefined;
  /** The station you ride from to reach `slug` (none for the first on the network). */
  prevStop: (slug: string) => Stop | undefined;
  /** The station after `slug`: the next ride's destination (none at the end of the network). */
  nextStop: (slug: string) => Stop | undefined;
};

/**
 * The railway as it runs: only the stations in `open` (the published journeys).
 * Numbers, neighbours and each line's tools all skip the rest, so a draft
 * between two stations is ridden straight past.
 */
export function railNet(open: ReadonlySet<string>): RailNet {
  const lines = MATH_RAIL.map((line) => ({ ...line, stations: line.stations.filter((st) => open.has(st.slug)) })).filter(
    (line) => line.stations.length,
  );
  const all: Stop[] = lines.flatMap((line) => line.stations.map((st, i) => ({ ...st, line, n: i + 1, index: 0 })));
  all.forEach((st, index) => (st.index = index));
  const bySlug = new Map(all.map((st) => [st.slug, st]));
  return {
    lines,
    stopOf: (slug) => bySlug.get(slug),
    prevStop: (slug) => {
      const st = bySlug.get(slug);
      return st && st.index > 0 ? all[st.index - 1] : undefined;
    },
    nextStop: (slug) => {
      const st = bySlug.get(slug);
      return st ? all[st.index + 1] : undefined;
    },
  };
}
