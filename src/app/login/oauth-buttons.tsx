"use client";

import { useState } from "react";
import { /* GoogleLogo, */ GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { LoadingOverlay } from "@/components/loading-overlay";

const providers = [
  // ponytail: temporarily hidden — restore with the GoogleLogo import above.
  // { id: "google", label: "Continue with Google", Icon: GoogleLogo },
  { id: "github", label: "Continue with GitHub", Icon: GithubLogo },
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
          className="btn-secondary"
        >
          <p.Icon size={18} weight="bold" />
          {p.label}
        </button>
      ))}
    </div>
  );
}
