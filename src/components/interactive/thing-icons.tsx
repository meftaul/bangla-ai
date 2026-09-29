// Small flat drawings for "things in the world" (a student, a photo, a mail…),
// drawn on the site's theme tokens instead of emoji, which read as AI filler.
// Shared by the representation journey and the main lesson's Figure 10.

export type ThingKind = "student" | "photo" | "mail" | "movie" | "food" | "patient";

const INK = "fill-none stroke-foreground/70";

export function ThingIcon({ kind, className = "size-9" }: { kind: ThingKind; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={`inline-block shrink-0 ${className}`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      {kind === "student" && (
        <>
          <path d="M 9 44 Q 9 30 24 30 Q 39 30 39 44 Z" className="fill-cat-blue" />
          <circle cx={24} cy={18} r={8} className="fill-cat-amber/60" />
          <path d="M 16 16 Q 17 8 24 8 Q 31 8 32 16 Q 27 12 16 16 Z" className="fill-foreground/70" />
          <rect x={27} y={34} width={10} height={8} rx={1} className="fill-surface stroke-foreground/70" />
        </>
      )}
      {kind === "photo" && (
        <>
          <rect x={5} y={9} width={38} height={30} rx={3} className="fill-cat-blue/15 stroke-foreground/70" />
          <circle cx={34} cy={17} r={3.5} className="fill-cat-amber" />
          <path d="M 7 37 L 18 23 L 26 31 L 31 26 L 41 37 Z" className="fill-cat-teal" />
          <path d="M 13 17 q 2 -2.5 4 0 q 2 -2.5 4 0" className={INK} strokeWidth={2} />
        </>
      )}
      {kind === "mail" && (
        <>
          <rect x={5} y={11} width={38} height={27} rx={3} className="fill-cat-coral/20 stroke-foreground/70" />
          <path d="M 6 13 L 24 27 L 42 13" className={INK} />
        </>
      )}
      {kind === "movie" && (
        <>
          <rect x={6} y={20} width={36} height={22} rx={2} className="fill-foreground/80" />
          <path d="M 6 12 L 40 6 L 41.5 13 L 7.5 19 Z" className="fill-foreground/80" />
          <path d="M 14 10.5 L 17 17 M 24 8.8 L 27 15.3 M 34 7 L 37 13.5" className="fill-none stroke-cat-amber" />
          <path d="M 12 29 H 36 M 12 34 H 28" className="fill-none stroke-surface/70" strokeWidth={2} />
        </>
      )}
      {kind === "food" && (
        <>
          <path d="M 18 14 q -3 -3 0 -6 M 24 14 q -3 -3 0 -6 M 30 14 q -3 -3 0 -6" className="fill-none stroke-muted" strokeWidth={2} />
          <path d="M 5 22 Q 7 40 24 40 Q 41 40 43 22 Z" className="fill-cat-blue" />
          <ellipse cx={24} cy={22} rx={19} ry={4} className="fill-cat-amber" />
        </>
      )}
      {kind === "patient" && (
        <>
          <path d="M 24 41 C 8 31 4 22 8 15 C 12 8 20 9 24 16 C 28 9 36 8 40 15 C 44 22 40 31 24 41 Z" className="fill-cat-coral/25 stroke-cat-coral" />
          <path d="M 9 25 H 17 L 20 19 L 25 31 L 28 25 H 39" className="fill-none stroke-foreground/75" />
        </>
      )}
    </svg>
  );
}
