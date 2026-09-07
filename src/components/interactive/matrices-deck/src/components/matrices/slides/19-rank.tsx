import { Eyebrow, Notes, Panel } from "../ui";

export default function RankSlide() {
  return (
    <section data-id="rank">
      <div className="wrap">
        <Eyebrow>The word for it</Eyebrow>
        <h2>
          <span className="ca">Rank</span> = how many dimensions actually survive.
        </h2>
        <div className="cols" style={{ marginTop: ".8rem", fontSize: ".78em" }}>
          <Panel>
            <p style={{ margin: "0 0 .5em" }}>
              <span className="tag">full rank</span>
            </p>
            <p className="note" style={{ margin: 0 }}>
              Nothing was flattened. Every input direction still has its own independent output
              direction. Reversible.
            </p>
          </Panel>
          <Panel>
            <p style={{ margin: "0 0 .5em" }}>
              <span
                className="tag"
                style={{ borderColor: "rgba(251,113,133,.5)", color: "var(--mbad)" }}
              >
                rank deficient
              </span>
            </p>
            <p className="note" style={{ margin: 0 }}>
              Some directions collapsed onto each other. The output lives in a thinner slice than it
              looks. Not reversible.
            </p>
          </Panel>
        </div>
        <p className="lead fragment grow-in" style={{ maxWidth: "32em", marginTop: "1.2rem" }}>
          A matrix’s shape tells you the <em>room available</em>. Its rank tells you{" "}
          <span className="hl">how much of that room it actually uses</span>.
        </p>
        <p className="note fragment grow-in" style={{ marginTop: ".4rem" }}>
          Same idea in three costumes: <span className="mono">det = 0</span> ·{" "}
          <span className="mono">collapsed grid</span> · <span className="mono">rank {"<"} n</span>.
        </p>
      </div>
      <Notes>
        “Shape tells you the room available. Rank tells you how much of that room is actually used.”
        Then unify explicitly — they will NOT do it themselves: “you’ve now seen the same fact three
        times in three costumes: the collapsing grid, det = 0, and rank {"<"} n. One idea, three
        names.”
      </Notes>
    </section>
  );
}
