import type { Metadata } from "next";
import Link from "next/link";
import OauthButtons from "./oauth-buttons";
import LoginForm from "./login-form";
import ThemeToggle from "../theme-toggle";
import Greeting from "../greeting";
import { Logo, LogoLockup } from "@/components/logo";

export const metadata: Metadata = {
  title: "Sign in — Bangla.AI",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="relative grid min-h-[100dvh] lg:grid-cols-2">
      {/* Theme toggle floats above both panels so light/dark is reachable on the
          auth screen, same affordance as the rest of the app. */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Brand panel — the "Joyful Lab" identity. Desktop only; on mobile the
          form panel carries a compact branded header instead. */}
      <aside className="hero-glow relative hidden flex-col overflow-hidden p-12 lg:flex">
        {/*<Link
          href="/"
          aria-label="Pathshala home"
          className="relative z-10 w-fit"
        >
          <LogoLockup className="text-foreground" />
        </Link>*/}

        <div className="relative z-10 flex flex-1 flex-col items-start justify-center gap-8">
          <Logo float interactive className="h-auto w-36 xl:w-44" />
          <div>
            <p className="fade-up flex items-center gap-2 text-sm font-semibold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <Greeting />
            </p>
            <h2
              className="fade-up mt-4 max-w-md font-display text-4xl font-bold leading-tight tracking-tight text-balance text-foreground xl:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Let&apos;s keep{" "}
              <span className="marker-stroke relative inline-block">
                learning
                <span
                  aria-hidden
                  className="marker-stroke-fill absolute inset-x-0 bottom-1.5 -z-10 h-4"
                />
              </span>
            </h2>
            {/*<p
              lang="bn"
              className="fade-up mt-4 max-w-sm font-bangla text-base leading-relaxed text-muted"
              style={{ animationDelay: "160ms" }}
            >
              পাঠশালায় ফিরে এসো — যেখানে থেমেছিলে, সেখান থেকেই শুরু করো।
            </p>*/}
          </div>
        </div>

        {/* Oversized watermark wordmark, same trick as the footer. */}
        <span
          aria-hidden
          lang="bn"
          className="pointer-events-none absolute -bottom-10 -right-6 select-none font-bangla text-[10rem] font-bold leading-none text-foreground/[0.04]"
        >
          পাঠশালা
        </span>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link href="/" aria-label="Pathshala home" className="lg:hidden">
            <LogoLockup className="text-foreground" />
          </Link>

          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-foreground lg:mt-0">
            Get started
          </h1>
          <p className="mt-2 text-sm text-muted">Sign in to continue.</p>

          {error && (
            <p className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-6 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-text">
              {message}
            </p>
          )}

          <LoginForm />

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <OauthButtons />

          <Link
            href="/"
            className="mt-6 inline-block text-sm text-muted transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
