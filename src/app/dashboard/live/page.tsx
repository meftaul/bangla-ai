import type { Metadata } from "next";
import { joinSession } from "../sessions/actions";

export const metadata: Metadata = { title: "Join live — Bangla.AI" };

export default async function JoinLivePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "notfound"
      ? "No live session with that code."
      : error === "empty"
        ? "Enter a join code."
        : null;

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Join a live session
      </h1>
      <p className="mt-2 text-sm text-muted">Enter the code your instructor is showing.</p>

      <form action={joinSession} className="mt-6 flex flex-col gap-3">
        <input
          name="code"
          autoFocus
          autoComplete="off"
          placeholder="e.g. K7M2QX"
          className="field-input bg-background px-4 py-3 text-center text-xl font-bold uppercase tracking-widest sm:text-2xl"
        />
        {message && <p className="text-sm text-red-500">{message}</p>}
        <button type="submit" className="btn-primary py-3">
          Join
        </button>
      </form>
    </div>
  );
}
