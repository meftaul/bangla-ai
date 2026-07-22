import type { Metadata } from "next";
import { LogoLockup } from "@/components/logo";
import { joinSession } from "@/app/dashboard/sessions/actions";
import { createClient } from "@/lib/supabase/server";
import GuestJoin from "./guest-join";

export const metadata: Metadata = { title: "Join live — Bangla.AI" };

// Public landing for QR / shared links: /join/CODE. Signed-in users (including
// returning guests) get a one-click join; everyone else picks a display name
// and joins anonymously.
export default async function JoinByCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code: raw } = await params;
  const { error } = await searchParams;
  const code = raw.toUpperCase();

  const message =
    error === "notfound"
      ? "No live session with that code. Double-check it with your teacher."
      : error === "empty"
        ? "Enter the join code to continue."
        : null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const who = data
    ? ((data.claims.email ??
        (data.claims.user_metadata as { display_name?: string } | undefined)
          ?.display_name ??
        "guest") as string)
    : null;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-card">
        <LogoLockup className="w-fit text-foreground" />

        <h1 className="mt-8 font-display text-2xl font-bold tracking-tight text-foreground">
          Join the live class
        </h1>
        <p className="mt-2 text-sm text-muted">
          Session code{" "}
          <span className="font-display font-bold tracking-widest text-foreground">
            {code}
          </span>
        </p>

        {message && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {message}
          </p>
        )}

        {who ? (
          <form action={joinSession} className="mt-6">
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="from" value={`/join/${code}`} />
            <button type="submit" className="btn-primary w-full justify-center py-3">
              Join as {who}
            </button>
          </form>
        ) : (
          <GuestJoin code={code} />
        )}
      </div>
    </main>
  );
}
