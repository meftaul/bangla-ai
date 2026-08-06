import type { MDXComponents } from "mdx/types";
import Slide from "@/components/slide";
import Quiz from "@/components/interactive/quiz";
import Poll from "@/components/interactive/poll";
import DragDrop from "@/components/interactive/drag-drop";
import Terminal from "@/components/interactive/terminal";
import ContextWindow from "@/components/interactive/context-window";
import PasswordMeter from "@/components/interactive/password-meter";

// Registered globally so MDX articles can use these without importing.
// Required by @next/mdx with the App Router.
const components: MDXComponents = { Slide, Quiz, Poll, DragDrop, Terminal, ContextWindow, PasswordMeter };

export function useMDXComponents(): MDXComponents {
  return components;
}
