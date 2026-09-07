import { Eyebrow, Notes } from "../ui";

export default function NextSlide() {
  return (
    <section data-id="next">
      <div className="wrap">
        <Eyebrow>Part II</Eyebrow>
        <h2 style={{ maxWidth: "15em" }}>
          Two matrices in a row are
          <br />
          still just one matrix.
        </h2>
        <p className="lead" style={{ maxWidth: "26em" }}>
          Which means a hundred stacked layers would collapse into a single one — a hundred-layer
          network no smarter than a straight line.
        </p>
        <p className="lead fragment grow-in" style={{ maxWidth: "26em" }}>
          The fix is one small, almost silly operation squeezed between the layers. It bends the
          grid — and that’s where <span className="hl">deep</span> learning starts.
        </p>
        <p className="tiny" style={{ marginTop: "2rem" }}>
          Next: composition, non-linearity, and why ReLU folds space.
        </p>
      </div>
      <Notes>
        Cliffhanger. Deliberately don’t resolve it — the collapse argument (W2·W1 = W3) is the
        strongest possible motivation for activation functions and deserves its own session. Two
        APPENDIX slides follow for Q&amp;A: the bias question and the row-view question. Don’t show
        them unless asked.
      </Notes>
    </section>
  );
}
