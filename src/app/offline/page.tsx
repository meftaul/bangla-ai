import Link from "next/link";

export const metadata = { title: "Offline — Pathshala" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-6">
      <div className="surface-card max-w-sm p-8 text-center">
        <h1 className="font-display text-2xl font-bold">You&apos;re offline</h1>
        <p className="mt-3 text-muted">
          Lessons you&apos;ve opened before still work. This one needs a connection.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
