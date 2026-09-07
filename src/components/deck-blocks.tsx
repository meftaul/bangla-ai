// Layout blocks shared by slide decks, registered globally in mdx-components.tsx.
// These exist because each was copy-pasted 17–24 times across two decks; the CSS
// for all of them lives in src/app/deck.css.

/** Full-bleed chapter divider: a huge translucent numeral with the title over it. */
export function Chapter({ n, ch, title }: { n: string; ch: string; title: string }) {
  return (
    <section className={`chapter ${ch}`}>
      <div className="chapter-in">
        <span className="num">{n}</span>
        <span className="ch-title">{title}</span>
      </div>
    </section>
  );
}

/** Pill-shaped takeaway chip. The status dot is drawn by ::before — no empty span. */
export function Verdict({
  tone,
  fragment,
  children,
}: {
  tone?: "accent" | "danger";
  fragment?: boolean;
  children: React.ReactNode;
}) {
  const cls = ["verdict", tone && `is-${tone}`, fragment && "fragment"].filter(Boolean);
  return <div className={cls.join(" ")}>{children}</div>;
}

/**
 * A concept paired with its diagram — the workhorse slide of the seminar decks.
 * `art` is a raw SVG string (the decks keep theirs in a SVGS map); every point
 * reveals as its own fragment, so authors never repeat `className="fragment fade-up"`.
 */
export function Evo({
  art,
  n,
  title,
  lead,
  points,
  flip,
  verdict,
  verdictTone = "accent",
  ch,
}: {
  art: string;
  n: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  points: React.ReactNode[];
  flip?: boolean;
  verdict?: React.ReactNode;
  verdictTone?: "accent" | "danger";
  ch?: string;
}) {
  return (
    <section className={ch}>
      <div className={flip ? "evo is-flip" : "evo"}>
        <div className="evo-art" dangerouslySetInnerHTML={{ __html: art }} />
        <div className="evo-copy">
          <span className="n">{n}</span>
          <h2>{title}</h2>
          {lead ? <p className="lead">{lead}</p> : null}
          <ul>
            {points.map((p, i) => (
              <li key={i} className="fragment fade-up">
                {p}
              </li>
            ))}
          </ul>
          {verdict ? (
            <Verdict tone={verdictTone} fragment>
              {verdict}
            </Verdict>
          ) : null}
        </div>
      </div>
    </section>
  );
}
