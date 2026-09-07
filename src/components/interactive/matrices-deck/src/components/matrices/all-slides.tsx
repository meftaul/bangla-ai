import TitleSlide from "./slides/01-title";
import PitchSlide from "./slides/02-pitch";
import CutSlide from "./slides/03-cut";
import TangleSlide from "./slides/04-tangle";
import UntangleSlide from "./slides/05-untangle";
import CoordsSlide from "./slides/06-coords";
import MachineSlide from "./slides/07-machine";
import NumLineSlide from "./slides/08-numline";
import VectorSlide from "./slides/09-vector";
import MatMachineSlide from "./slides/10-matmachine";
import AllSpaceSlide from "./slides/11-allspace";
import LinearSlide from "./slides/12-linear";
import ColumnsSlide from "./slides/13-columns";
import PlaySlide from "./slides/14-play";
import DetSlide from "./slides/15-det";
import ShapeSlide from "./slides/16-shape";
import LiftSlide from "./slides/17-lift";
import SquashSlide from "./slides/18-squash";
import RankSlide from "./slides/19-rank";
import NetSlide from "./slides/20-net";
import RecapSlide from "./slides/21-recap";
import NextSlide from "./slides/22-next";
import BiasSlide from "./slides/23-bias";
import RowsSlide from "./slides/24-rows";

// The whole talk, in order, as reveal's `.slides` children. Each slide renders its
// own <section>, so this is a fragment — nothing wraps them, which is what reveal
// requires. Drop this straight inside <Deck>, or list the slides yourself (see
// content/articles/matrices-are-transformers.mdx) to reorder or cut any of them.
//
// Slides 23 and 24 are appendix material for Q&A. The standalone deck kept them
// in the flow; leave them out if you'd rather end on the Part II teaser.
export default function AllSlides() {
  return (
    <>
      <TitleSlide />
      <PitchSlide />
      <CutSlide />
      <TangleSlide />
      <UntangleSlide />
      <CoordsSlide />
      <MachineSlide />
      <NumLineSlide />
      <VectorSlide />
      <MatMachineSlide />
      <AllSpaceSlide />
      <LinearSlide />
      <ColumnsSlide />
      <PlaySlide />
      <DetSlide />
      <ShapeSlide />
      <LiftSlide />
      <SquashSlide />
      <RankSlide />
      <NetSlide />
      <RecapSlide />
      <NextSlide />
      <BiasSlide />
      <RowsSlide />
    </>
  );
}
