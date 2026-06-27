import Link from "next/link";

// ponytail: in-memory slicing drives most callers; fine at current content
// volume. Swap disk-derived lists to a real cursor only if counts grow large.
export function Pager({
  page,
  totalPages,
  param = "page",
  params,
}: {
  page: number;
  totalPages: number;
  param?: string;
  params: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  // Relative ?… href keeps the same route and preserves any sibling list's page param.
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (typeof v === "string") sp.set(k, v);
    sp.set(param, String(p));
    return `?${sp.toString()}`;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="mt-6 flex items-center justify-between gap-4">
      {prevDisabled ? (
        <span className="btn-secondary px-3 py-1.5 opacity-40">Prev</span>
      ) : (
        <Link href={href(page - 1)} className="btn-secondary px-3 py-1.5">
          Prev
        </Link>
      )}
      <span className="text-xs text-muted">
        {page} / {totalPages}
      </span>
      {nextDisabled ? (
        <span className="btn-secondary px-3 py-1.5 opacity-40">Next</span>
      ) : (
        <Link href={href(page + 1)} className="btn-secondary px-3 py-1.5">
          Next
        </Link>
      )}
    </nav>
  );
}
