import { Eyebrow, Notes } from "../ui";

// Static slide — no canvas, no state, so it stays a server component.
export default function PitchSlide() {
  return (
    <section data-id="pitch">
      <div className="wrap">
        <Eyebrow>Why this matters</Eyebrow>
        <h2 className="big" style={{ maxWidth: "16em" }}>
          A neural network is a stack of
          <br />
          transformations. That’s the whole thing.
        </h2>
        <div className="rule" style={{ maxWidth: "14em" }} />
        <ul style={{ fontSize: ".82em", maxWidth: "24em" }}>
          <li className="fragment grow-in">
            Each layer takes a shape and turns it into a different shape.
          </li>
          <li className="fragment grow-in">
            The transformation is written down as a <span className="k">matrix</span>.
          </li>
          <li className="fragment grow-in">
            Training = <span className="ca">searching for the numbers inside those matrices</span>.
          </li>
        </ul>
        <p className="lead fragment grow-in" style={{ marginTop: "1.4em" }}>
          So before anything else — what <em>is</em> a transformation? We already know one. We’ve
          known it since school.
        </p>
      </div>
      <Notes>
        Don’t rush. The claim “a network is just stacked transformations” is the thesis; everything
        after this slide is unpacking the word “transformation”. Say: “right now that last line
        means nothing to you. By the end it will be the most obvious sentence in the world.” Then go
        straight into the next four slides — that’s the WHY, and it’s the part people remember.
      </Notes>
    </section>
  );
}
