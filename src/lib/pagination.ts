export const PAGE_SIZE = 10;

// Parse a ?page-style param; clamp to >= 1. Returns 1 on missing/garbage.
export function pageNum(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
