import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

// Plugins as strings/serializable tuples — Turbopack can't receive JS function refs.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-math"],
    rehypePlugins: [["rehype-katex", {}]],
  },
});

export default withMDX(nextConfig);
