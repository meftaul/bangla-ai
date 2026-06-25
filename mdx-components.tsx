import type { MDXComponents } from "mdx/types";
import Slide from "@/components/slide";
import Quiz from "@/components/interactive/quiz";

// Registered globally so MDX articles can use <Slide> and <Quiz> without importing.
// Required by @next/mdx with the App Router.
const components: MDXComponents = { Slide, Quiz };

export function useMDXComponents(): MDXComponents {
  return components;
}
