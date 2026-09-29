import type { Metadata } from "next";
import Script from "next/script";
import {
  Geist,
  Space_Grotesk,
  Hind_Siliguri,
  Hanken_Grotesk,
  JetBrains_Mono,
  Big_Shoulders,
  Fredoka,
  Baloo_Da_2,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// Deck typography (src/app/deck.css). Self-hosted here rather than <link>-ed from
// each deck's MDX: same families, but preloaded and with no render-blocking
// third-party request or font-swap shift.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
});

// The railway around Math for AI (src/components/rail/): station boards and
// printed tickets.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  // next/font has no metrics to size a fallback for this face; a narrow system face stands in
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "sans-serif"],
});

// Tickets: rounded, friendly faces for the printed text (Latin + Bangla).
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const baloo = Baloo_Da_2({
  variable: "--font-baloo",
  subsets: ["latin", "bengali"],
});

export const metadata: Metadata = {
  title: "Bangla.AI — Let's Learn AI & Data Science",
  description:
    "Structured courses, hands-on notebooks, and real projects in AI and data science, built for Bengali and English learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${spaceGrotesk.variable} ${hindSiliguri.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} ${bigShoulders.variable} ${fredoka.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* Apply saved theme before paint to avoid a flash. next/script (beforeInteractive)
            is hoisted into the initial HTML head and runs before hydration — a raw <script>
            element trips Next 16's "scripts inside React components" warning. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.classList.add(t);}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
