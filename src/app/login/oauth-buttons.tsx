"use client";

import { createClient } from "@/lib/supabase/client";

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
] as const;

export default function OauthButtons() {
  async function signIn(provider: "google" | "github") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex flex-col gap-3">
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
