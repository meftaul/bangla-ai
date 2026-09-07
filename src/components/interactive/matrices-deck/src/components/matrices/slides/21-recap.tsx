import { Eyebrow, Notes } from "../ui";

export default function RecapSlide() {
  return (
    <section data-id="recap">
      <div className="wrap">
        <Eyebrow>Take these five things</Eyebrow>
        <h2>Recap.</h2>
        <ul style={{ fontSize: ".8em", maxWidth: "26em", marginTop: ".5rem" }}>
          <li className="fragment grow-in">
            A function is a <span className="k">mover</span>, not a calculator.
          </li>
          <li className="fragment grow-in">
            A matrix is a mover for <span className="k">whole spaces</span>.
          </li>
          <li className="fragment grow-in">
            Its <span className="k">columns</span> are where the axes land — that’s all a matrix is.
          </li>
          <li className="fragment grow-in">
            Its <span className="k">shape</span> is which dimensions go in and come out.
          </li>
          <li className="fragment grow-in">
            Its <span className="k">rank</span> is how much of that room really survives.
          </li>
        </ul>
      </div>
      <Notes>
        Read them slowly, one fragment at a time. If they leave with only one line, make it line 3:
        “the columns are where the axes land.” Every matrix fact you will ever need can be rebuilt
        from that sentence.
      </Notes>
    </section>
  );
}
