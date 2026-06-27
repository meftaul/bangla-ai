import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Space_Grotesk, Hind_Siliguri } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
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
      className={`${geistSans.variable} ${spaceGrotesk.variable} ${hindSiliguri.variable} h-full antialiased`}
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
