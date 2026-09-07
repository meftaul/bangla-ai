import { Eyebrow, Machine, Notes } from "../ui";

export default function MachineSlide() {
  return (
    <section data-id="machine">
      <div className="wrap">
        <Eyebrow>Step 1 · The familiar case</Eyebrow>
        <h2>A function is a machine.</h2>
        <Machine input="3" output="6">
          f(x) = 2x
        </Machine>
        <div className="cols" style={{ marginTop: ".6rem" }}>
          <p className="lead">
            Something goes in. Something comes out. The box in the middle <em>is</em> the function —
            the rule that decides what happens.
          </p>
          <p className="lead fragment grow-in">
            Notice what a function really does: it doesn’t “answer a question,” it{" "}
            <span className="hl">takes a thing and gives back a different thing</span>. It’s a mover.
          </p>
        </div>
      </div>
      <Notes>
        Safe ground on purpose — everyone knows f(x) = 2x. The move being made here is a change of
        VERB: “stop reading this as a question with an answer. Read it as a machine that takes 3 and
        moves it to 6.” Keep it physical: input → machine → output. Don’t write y = f(x).
      </Notes>
    </section>
  );
}
