"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr";
import { signIn /*, signUp, signInWithMagicLink */ } from "./actions";
import { FormPendingOverlay } from "@/components/loading-overlay";

// Client-only because of the password show/hide toggle and the entrance stagger.
// The three server actions are wired verbatim via formAction — identical flow to
// the old server-rendered form.
export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="mt-8 flex flex-col gap-5">
      <FormPendingOverlay />

      {/* One legitimate list stagger; each field eases up in sequence. Gated by
          reduced-motion via the .fade-up class (content visible without it). */}
      <div className="fade-up flex flex-col gap-2" style={{ animationDelay: "60ms" }}>
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

      <div className="fade-up flex flex-col gap-2" style={{ animationDelay: "120ms" }}>
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="field-input pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeSlash size={18} weight="bold" />
            ) : (
              <Eye size={18} weight="bold" />
            )}
          </button>
        </div>
      </div>

      <div
        className="fade-up flex flex-col gap-3"
        style={{ animationDelay: "180ms" }}
      >
        <button formAction={signIn} className="btn-primary mt-1 py-3 text-base">
          Sign in
        </button>
        {/* ponytail: temporarily hidden — sign-up + magic-link. Restore both
            (and their imports above) when enabling more login options. */}
        {/* <button formAction={signUp} className="btn-secondary">
          Create account
        </button>
        <button
          formAction={signInWithMagicLink}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Email me a magic link instead
        </button> */}
      </div>
    </form>
  );
}
