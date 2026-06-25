// reveal.js requires `.slides > section`. This is that section.
export default function Slide({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>;
}
