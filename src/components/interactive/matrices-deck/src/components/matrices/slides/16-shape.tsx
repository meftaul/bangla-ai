import { Eyebrow, Mat, Notes, Panel } from "../ui";

export default function ShapeSlide() {
  return (
    <section data-id="shape">
      <div className="wrap">
        <Eyebrow>Step 5 · Changing dimension</Eyebrow>
        <h2>
          The <em>shape</em> of a matrix is its wiring diagram.
        </h2>
        <Panel style={{ margin: ".8rem 0 1rem", maxWidth: "30em" }}>
          <div className="shapebox" style={{ justifyContent: "center", fontSize: "1.05em" }}>
            <span className="dimchip">ℝⁿ</span>
            <span className="arrowchip">──▶</span>
            <Mat cols={1}>
              <span>m × n</span>
            </Mat>
            <span className="arrowchip">──▶</span>
            <span className="dimchip">ℝᵐ</span>
          </div>
        </Panel>
        <div className="cols" style={{ fontSize: ".72em" }}>
          <ul>
            <li className="fragment grow-in">
              <span className="k">n columns</span> — one per input dimension. Each column says where
              that input axis lands.
            </li>
            <li className="fragment grow-in">
              <span className="k">m rows</span> — one per output dimension. Each landing spot needs
              m numbers to describe it.
            </li>
          </ul>
          <ul>
            <li className="fragment grow-in">
              <span className="mono">3×2</span> → takes 2D, outputs 3D. <span className="ca">Lifting.</span>
            </li>
            <li className="fragment grow-in">
              <span className="mono">2×3</span> → takes 3D, outputs 2D.{" "}
              <span className="ca">Squashing.</span>
            </li>
            <li className="fragment grow-in">
              <span className="mono">128×784</span> → the first layer of an MNIST network.
            </li>
          </ul>
        </div>
      </div>
      <Notes>
        The most practically useful slide for anyone who will ever debug a model. Mnemonic that
        actually sticks: “columns = inputs, rows = outputs.” Then MAKE THE ROOM ANSWER: “what shape
        must a matrix be to take 784 numbers and produce 128?” Wait for it. Getting them to say “128
        by 784” out loud is worth the silence.
      </Notes>
    </section>
  );
}
