import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./theme-toggle";

// ponytail: whole landing in one file; four small sections, no per-section files needed.

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      Bangla<span className="text-accent-text">.</span>AI
    </span>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Bangla.AI home">
          <Wordmark className="text-xl text-foreground" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/login" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 md:grid-cols-2">
      <div className="order-2 flex items-center px-4 py-16 sm:px-6 md:order-1 lg:px-12">
        <div className="w-full max-w-2xl">
          <p
            className="fade-up font-bangla text-base font-semibold text-accent-text"
            style={{ animationDelay: "0ms" }}
          >
            চলো শিখি
          </p>
          <h1
            className="fade-up mt-3 font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Let&apos;s learn AI and{" "}
            <span className="text-accent-text">data science.</span>
          </h1>
          <p
            className="fade-up mt-6 max-w-prose text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Structured courses, hands-on notebooks, and projects that take you from
            fundamentals to real models. Built for Bengali learners.
          </p>
          <div
            className="fade-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/login"
              className="rounded-md bg-accent px-6 py-3 text-base font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="relative order-1 min-h-[42vh] md:order-2 md:min-h-0">
        <Image
          src="https://picsum.photos/seed/bangla-ai-learning/1200/1500?grayscale"
          alt="A learner studying at a desk"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-accent/20 mix-blend-multiply" />
      </div>
    </section>
  );
}

function LoginCTA() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="scroll-reveal mx-auto max-w-3xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Create your account and start your first course.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Free to begin. Pick a track, open a notebook, and ship something real
          this week.
        </p>
        <Link
          href="/login"
          className="mt-9 inline-block rounded-md bg-accent px-7 py-3 text-base font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
        >
          Get started
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  const links = ["Courses", "About", "Privacy", "Contact"];
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <Wordmark className="text-lg text-foreground" />
          <p className="mt-1 text-sm text-muted">Let&apos;s Learn.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((label) => (
            <a
              key={label}
              href="#"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <p className="text-xs text-muted">© 2026 Bangla.AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LoginCTA />
      </main>
      <Footer />
    </>
  );
}
