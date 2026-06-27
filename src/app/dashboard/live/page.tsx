import type { Metadata } from "next";
import { Logo, LogoLockup } from "@/components/logo";
import CodeInput from "./code-input";

export const metadata: Metadata = { title: "Join live — Bangla.AI" };

export default async function JoinLivePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "notfound"
      ? "No live session with that code. Double-check it with your teacher."
      : error === "empty"
        ? "Enter the join code to continue."
        : null;

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface shadow-card lg:min-h-[34rem] lg:grid-cols-2">
      {/* Brand panel — desktop only; the form panel carries the identity on mobile. */}
      <aside className="hero-glow relative hidden flex-col justify-between p-10 lg:flex">
        <LogoLockup className="relative z-10 w-fit text-foreground" />

        <div className="relative z-10">
          <Logo float interactive className="h-auto w-28 xl:w-32" />
          <h2
            className="fade-up mt-8 max-w-xs font-display text-4xl font-bold leading-tight tracking-tight text-balance text-foreground"
            style={{ animationDelay: "80ms" }}
          >
            Follow along,{" "}
            <span className="marker-stroke relative inline-block">
              live
              <span
                aria-hidden
                className="marker-stroke-fill absolute inset-x-0 bottom-1.5 -z-10 h-4"
              />
            </span>
          </h2>
          <p
            lang="bn"
            className="fade-up mt-4 max-w-xs font-bangla text-base leading-relaxed text-muted"
            style={{ animationDelay: "160ms" }}
          >
            পাঠশালায় যোগ দাও — শিক্ষকের সাথে একসাথে, সরাসরি ক্লাসে।
          </p>
        </div>

        <p
          className="fade-up relative z-10 max-w-xs text-sm leading-relaxed text-muted"
          style={{ animationDelay: "220ms" }}
        >
          Your teacher shows a six-character code on screen — type it in to join
          the class in real time.
        </p>

        {/* Oversized watermark wordmark, same trick as login / footer. */}
        <span
          aria-hidden
          lang="bn"
          className="pointer-events-none absolute -bottom-8 -right-4 select-none font-bangla text-[8rem] font-bold leading-none text-foreground/[0.04]"
        >
          পাঠশালা
        </span>
      </aside>

      {/* Form panel */}
      <section className="flex flex-col justify-center p-8 sm:p-10">
        <LogoLockup className="mb-8 w-fit text-foreground lg:hidden" />

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Join a live class
        </h1>
        <p className="mt-2 text-sm text-muted">
          Enter the code your teacher is showing.
        </p>

        {message && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {message}
          </p>
        )}

        <CodeInput />
      </section>
    </div>
  );
}
