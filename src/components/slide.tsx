// reveal.js requires `.slides > section`. This is that section — props pass straight
// through, so a deck can use reveal's per-slide API (`className`, `data-transition`,
// `data-auto-animate`, `data-background-*`) without dropping to a raw <section>.
export default function Slide(props: React.ComponentProps<"section">) {
  return <section {...props} />;
}
