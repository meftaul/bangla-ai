// "Matrices are Transformers" — one tsx component per slide.
//
//   lib/        the canvas engine (Sketch, Plane, Scatter, NumberLine, Space3D)
//               plus the two React hooks that bind a slide to reveal's lifecycle
//   ui.tsx      the deck's shared markup vocabulary (Btn, Stage, Mat, Machine…)
//   slides/     24 components, numbered in presentation order
//
// Every slide owns its own state and its own canvas, so they can be reordered,
// dropped, or reused individually without touching anything else.

export { default as DeckStyles } from "./deck-styles";
export { default as AllSlides } from "./all-slides";

export { default as TitleSlide } from "./slides/01-title";
export { default as PitchSlide } from "./slides/02-pitch";
export { default as CutSlide } from "./slides/03-cut";
export { default as TangleSlide } from "./slides/04-tangle";
export { default as UntangleSlide } from "./slides/05-untangle";
export { default as CoordsSlide } from "./slides/06-coords";
export { default as MachineSlide } from "./slides/07-machine";
export { default as NumLineSlide } from "./slides/08-numline";
export { default as VectorSlide } from "./slides/09-vector";
export { default as MatMachineSlide } from "./slides/10-matmachine";
export { default as AllSpaceSlide } from "./slides/11-allspace";
export { default as LinearSlide } from "./slides/12-linear";
export { default as ColumnsSlide } from "./slides/13-columns";
export { default as PlaySlide } from "./slides/14-play";
export { default as DetSlide } from "./slides/15-det";
export { default as ShapeSlide } from "./slides/16-shape";
export { default as LiftSlide } from "./slides/17-lift";
export { default as SquashSlide } from "./slides/18-squash";
export { default as RankSlide } from "./slides/19-rank";
export { default as NetSlide } from "./slides/20-net";
export { default as RecapSlide } from "./slides/21-recap";
export { default as NextSlide } from "./slides/22-next";
export { default as BiasSlide } from "./slides/23-bias";
export { default as RowsSlide } from "./slides/24-rows";
