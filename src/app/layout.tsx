import type { Metadata } from "next";
import { Geist, Newsreader, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const notoBengali = Noto_Serif_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
});

export const metadata: Metadata = {
  title: "মেধা — Learn AI & Data Science",
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
      className={`${geistSans.variable} ${newsreader.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
