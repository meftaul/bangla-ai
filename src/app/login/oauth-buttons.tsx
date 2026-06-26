"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoadingOverlay } from "@/components/loading-overlay";

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
] as const;

export default function OauthButtons() {
  const [pending, setPending] = useState(false);

  async function signIn(provider: "google" | "github") {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setPending(false); // on success the browser redirects, leaving the overlay up
  }

  return (
    <div className="flex flex-col gap-3">
      <LoadingOverlay show={pending} />
      {providers.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => signIn(p.id)}
          className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
