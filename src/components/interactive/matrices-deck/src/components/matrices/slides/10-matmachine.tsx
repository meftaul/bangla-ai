import { Eyebrow, Mat, Machine, Notes } from "../ui";

export default function MatMachineSlide() {
  return (
    <section data-id="matmachine">
      <div className="wrap">
        <Eyebrow>Step 4 · Same machine, new input</Eyebrow>
        <h2>A matrix is a function that eats vectors.</h2>
        <Machine input="[ 3, 2 ]" output="[ 8, 2 ]" height="15.63cqw" boxWidth="14.84cqw">
          <Mat cols={2}>
            <span className="col1">2</span>
            <span className="col2">1</span>
            <span className="col1">0</span>
            <span className="col2">1</span>
          </Mat>
        </Machine>
        <div
          className="eq fragment grow-in"
          style={{ fontSize: ".72em", justifyContent: "center", marginTop: ".5rem" }}
        >
          <Mat cols={2} size="sm">
            <span className="col1">2</span>
            <span className="col2">1</span>
            <span className="col1">0</span>
            <span className="col2">1</span>
          </Mat>
          <span className="op">·</span>
          <Mat cols={1} size="sm">
            <span>3</span>
            <span>2</span>
          </Mat>
          <span className="op">=</span>
          <Mat cols={1} size="sm">
            <span>2(3) + 1(2)</span>
            <span>0(3) + 1(2)</span>
          </Mat>
          <span className="op">=</span>
          <Mat cols={1} size="sm" style={{ color: "var(--mv)" }}>
            <span>8</span>
            <span>2</span>
          </Mat>
        </div>
        <p className="lead fragment grow-in" style={{ maxWidth: "30em", marginTop: "1rem" }}>
          Same story as <span className="mono">f(x) = 2x</span> — vector in, vector out. But the
          arithmetic is <em>not</em> the point.{" "}
          <span className="hl">Watch what it does to the picture.</span>
        </p>
      </div>
      <Notes>
        Show the arithmetic once, then explicitly demote it: “you will never get intuition from
        this. Nobody in history has looked at that row-by-column dance and thought ‘ah, now I see
        what it means.’ Here’s the important part —” and turn the page fast. Momentum matters here.
      </Notes>
    </section>
  );
}
