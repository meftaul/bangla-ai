import Image from "next/image";
import Link from "next/link";

// ponytail: whole landing in one file; four small sections, no per-section files needed.

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-bangla text-2xl leading-none text-foreground"
        >
          মেধা
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-16 pb-20 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:pt-12 lg:px-8">
      <div className="max-w-2xl">
        <p
          className="fade-up font-bangla text-base text-accent"
          style={{ animationDelay: "0ms" }}
        >
          মেধা দিয়ে শেখা
        </p>
        <h1
          className="fade-up mt-4 font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl"
          style={{ animationDelay: "80ms" }}
        >
          Master AI and data science,{" "}
          <em className="italic text-accent">one idea at a time.</em>
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

      <div
        className="fade-up relative aspect-[4/5] w-full overflow-hidden rounded-md border border-border md:aspect-[3/4]"
        style={{ animationDelay: "200ms" }}
      >
        <Image
          src="https://picsum.photos/seed/medha-ai-learning/900/1200?grayscale"
          alt="A learner studying at a desk"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}

function LoginCTA() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="scroll-reveal mx-auto max-w-3xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
        <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-5xl">
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
          <p className="font-bangla text-xl text-foreground">মেধা</p>
          <p className="mt-1 text-sm text-muted">
            Learn AI and data science, in Bangla and English.
          </p>
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
        <p className="text-xs text-muted">© 2026 মেধা. All rights reserved.</p>
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
