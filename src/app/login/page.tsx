import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signUp, signInWithMagicLink } from "./actions";
import OauthButtons from "./oauth-buttons";

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
    <main className="grid min-h-[100dvh] place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-foreground"
          aria-label="Bangla.AI home"
        >
          Bangla<span className="text-accent-text">.</span>AI
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-foreground">
          Get started
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to continue, or create your account.
        </p>

        {error && (
          <p className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-6 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-text">
            {message}
          </p>
        )}

        <form className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
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
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-md border border-border bg-surface px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
            />
          </div>

          <button
            formAction={signIn}
            className="mt-1 rounded-md bg-accent px-4 py-2.5 text-base font-medium text-accent-foreground transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Sign in
          </button>
          <button
            formAction={signUp}
            className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
          >
            Create account
          </button>
          <button
            formAction={signInWithMagicLink}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Email me a magic link instead
          </button>
        </form>

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
    </main>
  );
}
