// TEMP: layout measurement harness for the graph paper journey. Delete after use.
import "katex/dist/katex.min.css";
import Article from "@/content/articles/math_for_ai/01a_graph_paper.mdx";
import { RailOpen } from "@/components/rail/open";
import { RAIL_SLUGS } from "@/content/rail";

export default function Page() {
  return (
    <div className="px-0 pt-0 sm:px-6 sm:pt-[5rem] lg:px-10 lg:pt-[6rem]">
      <div className="mx-auto w-full max-w-3xl">
        <article className="article surface-card overflow-hidden p-0 h-dvh min-h-[26rem] sm:h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-8.5rem)]">
          <RailOpen slugs={RAIL_SLUGS}>
            <Article />
          </RailOpen>
        </article>
      </div>
    </div>
  );
}
