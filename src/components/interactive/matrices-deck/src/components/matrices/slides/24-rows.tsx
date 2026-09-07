import { Eyebrow, Notes, Panel } from "../ui";

export default function RowsSlide() {
  return (
    <section data-id="rows">
      <div className="wrap">
        <Eyebrow>Appendix · if someone asks</Eyebrow>
        <h2>“I was taught rows are features.”</h2>
        <p className="lead" style={{ maxWidth: "34em" }}>
          Both readings are right. Same numbers, two lenses.
        </p>
        <div className="cols" style={{ marginTop: ".6rem", fontSize: ".75em" }}>
          <Panel>
            <p style={{ margin: "0 0 .5em" }}>
              <span
                className="tag"
                style={{ borderColor: "rgba(45,212,191,.5)", color: "var(--mi)" }}
              >
                column view
              </span>
            </p>
            <p className="note" style={{ margin: 0 }}>
              Each column = <span className="k">where an input axis lands</span>. Explains{" "}
              <span className="ca">geometry</span> — what happens to space. Gives you rank,
              determinant, composition.
            </p>
          </Panel>
          <Panel>
            <p style={{ margin: "0 0 .5em" }}>
              <span
                className="tag"
                style={{ borderColor: "rgba(244,114,182,.5)", color: "var(--mj)" }}
              >
                row view
              </span>
            </p>
            <p className="note" style={{ margin: 0 }}>
              Each row = <span className="k">one question asked of the input</span> (“how much edge
              is here?”). Explains <span className="ca">features</span> — what each output neuron
              detects.
            </p>
          </Panel>
        </div>
        <p className="lead fragment grow-in" style={{ maxWidth: "34em", marginTop: "1rem" }}>
          This talk chose columns on purpose: it’s the view that survives into{" "}
          <span className="k">rank</span>, <span className="k">determinant</span> and{" "}
          <span className="k">composition</span>.
        </p>
      </div>
      <Notes>
        Row view is how people usually explain a single neuron (dot product = similarity score).
        Column view is how people explain a whole layer as a transformation. Neither is more true;
        the column view is just the one that keeps paying off later.
      </Notes>
    </section>
  );
}
