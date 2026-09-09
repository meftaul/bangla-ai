import type { ReactNode } from "react";

// A table for prose articles.
//
// ponytail: markdown pipe tables would be the natural way to write these, but
// they are a GFM extension and this MDX pipeline runs only remark-math — so a
// pipe table renders as a literal row of "|" characters. A component gets the
// same job done without adding remark-gfm; swap to plain markdown tables if that
// plugin is ever added.

type Cell = ReactNode;

/** digits, decimals, percents, signs — ASCII or Bangla numerals, and the
 *  parenthesised tuples this series writes vectors as: (180, 78) */
const NUMERIC = /^\(?[\d০-৯][\d০-৯.,%+\-–\s]*\)?$/;

const isNumeric = (c: Cell) =>
  (typeof c === "number" || typeof c === "string") && NUMERIC.test(String(c).trim());

export default function Table({
  head,
  rows,
  note,
}: {
  head: Cell[];
  rows: Cell[][];
  /** small print under the table — a unit, a legend, a caveat */
  note?: ReactNode;
}) {
  // A column reads as numbers only if every cell in it does; those get the mono
  // face and right alignment, so digits line up by place value down the column.
  const numeric = head.map((_, i) => rows.length > 0 && rows.every((r) => isNumeric(r[i])));

  return (
    <div className="atable-wrap">
      <table className="atable">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={numeric[i] ? "num" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={numeric[ci] ? "num" : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {note ? <p className="atable-note">{note}</p> : null}
    </div>
  );
}
