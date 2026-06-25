import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in — মেধা",
};

// ponytail: stub login, no auth wired. Static form, submits nowhere.
// Add a real action + provider when auth is actually built.
export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-bangla text-2xl text-foreground"
          aria-label="মেধা home"
        >
          মেধা
        </Link>

        <h1 className="mt-8 font-display text-3xl tracking-tight text-foreground">
          Get started
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to continue, or create your account.
        </p>

        <form className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-md border border-border bg-surface px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-md border border-border bg-surface px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-md bg-accent px-4 py-2.5 text-base font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Get started
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-muted transition-colors hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
