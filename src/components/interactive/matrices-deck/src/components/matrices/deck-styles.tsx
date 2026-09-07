// Deck-local theme for "Matrices are Transformers".
//
// Everything is scoped under `.reveal`, matching how the other decks in this app
// ship their CSS (see learn-claude-code.mdx) — so nothing here can leak into the
// dashboard chrome. The palette is re-declared as `--m*` custom properties rather
// than the single-letter names the standalone file used, because `--i` collides
// with the results-bar stagger index in globals.css.
//
// The canvas side of the deck reads the same colours from `COL` in lib/math.ts.
// Change one, change the other.
export default function DeckStyles() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- the rule is a
          pages-router check; this App Router deck ships its own fonts inline, the
          same way learn-claude-code.mdx does. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
      />
      <style>{CSS}</style>
    </>
  );
}

const CSS = `
.reveal, .reveal-viewport {
  --mbg:#070a12; --mink:#e9edf7; --mdim:#8d97ae; --mfaint:#5c657d;
  --mi:#2dd4bf;  --mj:#f472b6;  --mv:#fbbf24; --macc:#818cf8; --mbad:#fb7185;
  --mline:rgba(255,255,255,.10);
}
/* reveal's white theme paints every layer white — override them all. */
.reveal-viewport, .reveal { background: var(--mbg); }

/* The ambient glow. Fixed in the standalone file; absolute here because the deck
   is embedded in a page rather than owning the viewport. */
.reveal::before {
  content:''; position:absolute; inset:0; z-index:0; pointer-events:none;
  background:
    radial-gradient(900px 600px at 12% 8%,  rgba(129,140,248,.16), transparent 60%),
    radial-gradient(800px 600px at 88% 92%, rgba(45,212,191,.12),  transparent 60%),
    radial-gradient(700px 500px at 70% 12%, rgba(244,114,182,.09), transparent 60%);
}

.reveal {
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  color:var(--mink); font-size:30px; font-weight:400;
}

/* This deck was authored against reveal's 1280x760 canvas; the app's <Deck> uses
   reveal's 960x700 default. Rather than hard-code either, every size below is a
   fraction of the canvas WIDTH: .slides is sized in px by reveal's layout(), so
   making it a query container turns 1cqw into "1% of the deck canvas". 2.344cqw is
   the original 30px at 1280. Nothing here needs the deck to be configured. */
.reveal .slides{ text-align:left; container-type:inline-size; }
.reveal .slides section{ height:100%; font-size:2.344cqw; }
.reveal h1,.reveal h2,.reveal h3,.reveal h4{
  font-family:'Space Grotesk',sans-serif; font-weight:700; color:var(--mink);
  letter-spacing:-.025em; text-transform:none; text-shadow:none; margin:0 0 .38em; line-height:1.06;
}
.reveal h1{ font-size:2.45em; }
.reveal h2{ font-size:1.5em; }
.reveal h3{ font-size:1.02em; font-weight:600; color:var(--mdim); letter-spacing:0; }
.reveal p{ line-height:1.5; margin:0 0 .65em; color:#cdd4e4; }
.reveal ul{ list-style:none; margin:0; padding:0; }
.reveal ul li{ position:relative; padding-left:1.1em; margin:0 0 .55em; line-height:1.45; color:#cdd4e4; }
.reveal ul li::before{ content:''; position:absolute; left:0; top:.6em; width:.42em; height:.42em;
  border-radius:50%; background:var(--macc); }
.reveal a{ color:var(--macc); }
.reveal section img{ border:0; box-shadow:none; }
.reveal .progress{ color:var(--macc); height:3px; }
.reveal .controls{ color:var(--mfaint); }
.reveal .slide-number{ background:transparent; color:var(--mfaint);
  font-family:'JetBrains Mono',monospace; font-size:15px; }

/* ---------- text helpers ---------- */
.reveal .eyebrow{
  font-family:'JetBrains Mono',monospace; font-size:.5em; font-weight:600;
  letter-spacing:.22em; text-transform:uppercase; color:var(--macc); margin:0 0 1.1em;
}
.reveal .lead{ font-size:.86em; color:var(--mdim); line-height:1.55; max-width:22em; }
.reveal .tiny{ font-size:.62em; color:var(--mfaint); line-height:1.5; }
.reveal .note{ font-size:.66em; color:var(--mdim); line-height:1.5; }
.reveal .mono{ font-family:'JetBrains Mono',monospace; }
.reveal .k{ color:var(--mink); font-weight:600; }
.reveal .ci{ color:var(--mi); font-weight:600; } .reveal .cj{ color:var(--mj); font-weight:600; }
.reveal .cv{ color:var(--mv); font-weight:600; } .reveal .ca{ color:var(--macc); font-weight:600; }
.reveal .cbad{ color:var(--mbad); font-weight:600; }
.reveal .hl{ background:linear-gradient(transparent 62%, rgba(129,140,248,.30) 0); padding:0 .08em; }
.reveal .big{ font-size:1.15em; line-height:1.35; }

/* ---------- layout ---------- */
.reveal .wrap{ height:100%; display:flex; flex-direction:column; justify-content:center; }
.reveal .cols{ display:grid; grid-template-columns:1fr 1fr; gap:2.2rem; align-items:center; }
.reveal .cols.l{ grid-template-columns:1.05fr .95fr; }
.reveal .cols.r{ grid-template-columns:.95fr 1.05fr; }
.reveal .cols.narrow{ grid-template-columns:.8fr 1.2fr; }
.reveal .stack{ display:flex; flex-direction:column; gap:.9rem; }
.reveal .row{ display:flex; align-items:center; gap:.8rem; flex-wrap:wrap; }

.reveal .panel{
  background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015));
  border:1px solid var(--mline); border-radius:16px; padding:1rem 1.15rem;
}
.reveal .panel.tight{ padding:.7rem .9rem; }

/* ---------- canvas stages ---------- */
.reveal .stage{ position:relative; width:100%; border-radius:16px; overflow:hidden;
  background:radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,.045), rgba(255,255,255,.012));
  border:1px solid var(--mline); }
.reveal .stage canvas{ display:block; width:100%; height:100%; }
.reveal .stage.sq{ aspect-ratio:1/1; }
.reveal .stage.wide{ aspect-ratio:16/9; }
.reveal .stage.h4{ aspect-ratio:4/3; }
.reveal .stage.bare{ background:none; border:0; border-radius:0; }
.reveal .stage .badge{
  position:absolute; left:12px; top:10px; font-family:'JetBrains Mono',monospace;
  font-size:13px; letter-spacing:.06em; color:var(--mfaint); text-transform:uppercase;
}
.reveal .stage .badge.ok{ color:var(--mi); } .reveal .stage .badge.no{ color:var(--mbad); }

.reveal .bgstage{ position:absolute; inset:0; z-index:0; opacity:.5; border:0; border-radius:0;
  background:none; }
.reveal .bgstage canvas{ width:100%; height:100%; }

/* ---------- matrix / vector notation ---------- */
.reveal .mat{ display:inline-flex; align-items:stretch; gap:.16em; vertical-align:middle;
  font-family:'JetBrains Mono',monospace; line-height:1.3; color:var(--mink); }
.reveal .mat::before,.reveal .mat::after{ content:''; width:.3em; border:2px solid var(--mfaint);
  border-radius:4px; flex:0 0 auto; }
.reveal .mat::before{ border-right:0; } .reveal .mat::after{ border-left:0; }
.reveal .mat>.g{ display:grid; grid-template-columns:repeat(var(--c,2), minmax(1.6em,auto));
  gap:.12em .55em; padding:.3em .1em; text-align:center; }
.reveal .mat.lg{ font-size:1.25em; } .reveal .mat.sm{ font-size:.72em; }
.reveal .mat .col1{ color:var(--mi); } .reveal .mat .col2{ color:var(--mj); }
.reveal .mat .col3{ color:var(--macc); }

.reveal .eq{ display:flex; align-items:center; gap:.5em; font-family:'JetBrains Mono',monospace;
  flex-wrap:wrap; }
.reveal .eq .op{ color:var(--mfaint); }

/* ---------- machine ---------- */
.reveal .machine{ position:relative; height:14.84cqw; display:flex; align-items:center; justify-content:center; }
.reveal .mach-box{
  position:relative; z-index:2; width:13.28cqw; height:9.22cqw; border-radius:18px;
  background:linear-gradient(180deg,#1b2438,#131a2b); border:1px solid rgba(129,140,248,.45);
  box-shadow:0 0 0 6px rgba(129,140,248,.07), 0 18px 40px -18px rgba(0,0,0,.9);
  display:flex; align-items:center; justify-content:center; text-align:center;
  font-family:'JetBrains Mono',monospace; font-size:.8em; color:var(--mink);
}
.reveal .mach-box small{ position:absolute; top:-1.6em; left:0; right:0; text-align:center;
  font-family:'JetBrains Mono',monospace; font-size:.42em; letter-spacing:.18em;
  text-transform:uppercase; color:var(--mfaint); }
.reveal .rail{ position:absolute; top:50%; height:2px; width:100%; left:0;
  background:repeating-linear-gradient(90deg, var(--mline) 0 10px, transparent 10px 20px); }
.reveal .tok{
  position:absolute; top:50%; left:50%; z-index:3; transform:translate(-50%,-50%);
  padding:.32em .7em; border-radius:99px; font-family:'JetBrains Mono',monospace; font-size:.72em;
  font-weight:600; opacity:0; white-space:nowrap;
}
.reveal .tok.in{  background:rgba(45,212,191,.16);  border:1px solid rgba(45,212,191,.55);  color:#7ff0e2; }
.reveal .tok.out{ background:rgba(251,191,36,.16); border:1px solid rgba(251,191,36,.55); color:#ffd98a; }
.reveal .present .tok.in { animation:mtokIn  3.2s cubic-bezier(.5,0,.5,1) infinite; }
.reveal .present .tok.out{ animation:mtokOut 3.2s cubic-bezier(.5,0,.5,1) infinite; }
@keyframes mtokIn{
  0%{ transform:translate(-31.25cqw,-50%) scale(.85); opacity:0 }
  14%{ opacity:1 }
  40%{ transform:translate(-12.89cqw,-50%) scale(1); opacity:1 }
  50%{ transform:translate(-9.22cqw,-50%) scale(.72); opacity:0 }
  100%{ transform:translate(-9.22cqw,-50%) scale(.72); opacity:0 }
}
@keyframes mtokOut{
  0%,50%{ transform:translate(9.22cqw,-50%) scale(.72); opacity:0 }
  60%{ transform:translate(12.89cqw,-50%) scale(1); opacity:1 }
  86%{ transform:translate(26.95cqw,-50%) scale(1); opacity:1 }
  100%{ transform:translate(31.25cqw,-50%) scale(.85); opacity:0 }
}

/* ---------- controls ---------- */
.reveal .btns{ display:flex; gap:.45rem; flex-wrap:wrap; }
.reveal .btn{
  font-family:'JetBrains Mono',monospace; font-size:.52em; letter-spacing:.04em;
  padding:.55em .85em; border-radius:9px; cursor:pointer;
  background:rgba(255,255,255,.05); border:1px solid var(--mline); color:var(--mdim);
  transition:all .15s ease;
}
.reveal .btn:hover{ background:rgba(129,140,248,.16); border-color:rgba(129,140,248,.5); color:var(--mink); }
.reveal .btn.on{ background:rgba(129,140,248,.22); border-color:var(--macc); color:var(--mink); }

.reveal .sliders{ display:grid; grid-template-columns:auto 1fr auto; gap:.35rem .7rem;
  align-items:center; font-family:'JetBrains Mono',monospace; font-size:.55em; }
.reveal .sliders label{ color:var(--mdim); }
.reveal input[type=range]{ -webkit-appearance:none; appearance:none; height:3px; border-radius:3px;
  background:rgba(255,255,255,.16); outline:none; width:100%; }
.reveal input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; width:15px; height:15px;
  border-radius:50%; background:var(--macc); cursor:pointer; border:2px solid #0d1220; }
.reveal input[type=range]::-moz-range-thumb{ width:15px; height:15px; border-radius:50%;
  background:var(--macc); cursor:pointer; border:2px solid #0d1220; }
.reveal .val{ color:var(--mink); min-width:3.4em; text-align:right; }

.reveal .readout{ font-family:'JetBrains Mono',monospace; font-size:.58em; color:var(--mdim); }
.reveal .readout b{ color:var(--mink); font-weight:600; }

/* ---------- misc bits ---------- */
.reveal .tag{ display:inline-block; font-family:'JetBrains Mono',monospace; font-size:.46em;
  letter-spacing:.14em; text-transform:uppercase; padding:.35em .7em; border-radius:99px;
  border:1px solid var(--mline); color:var(--mdim); }
.reveal .rule{ height:1px; background:var(--mline); margin:.4em 0 .9em; }
.reveal .fragment.grow-in{ opacity:0; transform:translateY(8px); transition:all .35s ease; }
.reveal .fragment.grow-in.visible{ opacity:1; transform:none; }
.reveal .shapebox{ display:flex; align-items:center; gap:1rem; font-family:'JetBrains Mono',monospace; }
.reveal .dimchip{ padding:.4em .8em; border-radius:10px; border:1px solid var(--mline);
  font-size:.62em; color:var(--mink); background:rgba(255,255,255,.04); }
.reveal .arrowchip{ color:var(--macc); font-size:.8em; }
.reveal kbd{ font-family:'JetBrains Mono',monospace; font-size:.75em; background:rgba(255,255,255,.08);
  border:1px solid var(--mline); border-radius:5px; padding:.1em .4em; }
`;
