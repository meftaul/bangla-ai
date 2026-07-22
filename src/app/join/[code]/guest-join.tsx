"use client";

import { useState, useTransition } from "react";
import { joinSession } from "@/app/dashboard/sessions/actions";
import { createClient } from "@/lib/supabase/client";

// Name form for visitors without an account: anonymous sign-in (display name in
// user_metadata), then the existing joinSession action takes over. Sign-in runs
// in the submit handler only, so StrictMode double effects can't duplicate it.
export default function GuestJoin({ code }: { code: string }) {
  const [name, setName] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setFailed(false);
      const supabase = createClient();
      // ponytail: skip sign-in if an anon session already exists (double submit / back button)
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        const { error } = await supabase.auth.signInAnonymously({
          options: { data: { display_name: name.trim() } },
        });
        if (error) {
          setFailed(true);
          return;
        }
      }
      const fd = new FormData();
      fd.set("code", code);
      fd.set("from", `/join/${code}`);
      await joinSession(fd); // redirects to the live viewer
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-6">
      <label htmlFor="guest-name" className="block text-sm font-medium text-foreground">
        Your name
      </label>
      <input
        id="guest-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={40}
        autoFocus
        autoComplete="name"
        placeholder="e.g. Rina"
        className="field-input mt-2 w-full"
      />

      {failed && (
        <p role="alert" className="mt-3 text-sm text-danger">
          Couldn&apos;t join right now — please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="btn-primary mt-5 w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Joining…" : "Join as guest"}
      </button>
    </form>
  );
}
