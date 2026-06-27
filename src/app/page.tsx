import Link from "next/link";
import { ArrowRight, Heart } from "@phosphor-icons/react/dist/ssr";
import ThemeToggle from "./theme-toggle";
import { Logo, LogoLockup } from "@/components/logo";

// ponytail: whole landing in one file; four sections, no per-section files needed.

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Pathshala home">
          <LogoLockup className="text-foreground" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero-glow">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-32 lg:px-8">
        <div className="order-2 md:order-1">
          <p className="fade-up flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Interactive Learning
          </p>
          <h1
            className="fade-up mt-5 font-display text-6xl font-bold leading-none tracking-tight text-accent-text sm:text-7xl lg:text-8xl"
            style={{ animationDelay: "80ms" }}
          >
            <span className="relative inline-block">
              Let&apos;s Learn
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-2 -z-10 h-5 bg-accent/15"
              />
            </span>
          </h1>
          <div className="fade-up mt-10" style={{ animationDelay: "160ms" }}>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Let&apos;s Start Now
              <ArrowRight
                weight="bold"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          <Logo float className="h-auto w-56 sm:w-72 lg:w-80" />
        </div>
      </div>
    </section>
  );
}

function JoinCTA() {
  return (
    <section className="bg-background pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className="scroll-reveal rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20"
          style={{ background: "var(--accent-deep)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Join in
          </p>
          <h2 className="mt-4 font-bangla text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            শেখাটা মজার হোক, আজ থেকেই।
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-bangla text-base leading-relaxed text-white/70">
            পাঠশালায় ঢুকে পড়ো
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-accent px-8 py-3.5 font-bangla text-base font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
          >
            শুরু করো
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: "var(--accent-deep)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <LogoLockup light className="relative z-10 text-white" />
        <p className="relative z-10 flex items-center gap-1.5 font-bangla text-sm text-white/60">
          © ২০২৬ Pathshala · পাঠশালা
          <Heart weight="regular" className="text-white/60" />
        </p>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 right-2 select-none font-bangla text-8xl font-bold text-white/5"
      >
        পাঠশালা
      </span>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <JoinCTA />
      </main>
      <Footer />
    </>
  );
}
