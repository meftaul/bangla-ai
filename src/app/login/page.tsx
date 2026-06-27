import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signUp, signInWithMagicLink } from "./actions";
import OauthButtons from "./oauth-buttons";
import { FormPendingOverlay } from "@/components/loading-overlay";
import { LogoLockup } from "@/components/logo";

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
        <Link href="/" aria-label="Bangla.AI home">
          <LogoLockup className="text-xl text-foreground" />
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-foreground">
          Get started
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to continue, or create your account.
        </p>

        {error && (
          <p className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-6 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-text">
            {message}
          </p>
        )}

        <form className="mt-8 flex flex-col gap-5">
          <FormPendingOverlay />
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
              className="field-input"
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
              className="field-input"
            />
          </div>

          <button formAction={signIn} className="btn-primary mt-1 py-3 text-base">
            Sign in
          </button>
          <button formAction={signUp} className="btn-secondary">
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
