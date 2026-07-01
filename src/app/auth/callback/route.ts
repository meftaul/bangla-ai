import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  // Standalone binds 0.0.0.0:3000, so request.nextUrl.origin is https://0.0.0.0:3000
  // behind nginx. SITE_URL pins the public origin (set it in prod; falls back to
  // the request origin for local dev). ponytail: plain env, not NEXT_PUBLIC_ —
  // read at runtime so --env-file works without a rebuild.
  const siteUrl = process.env.SITE_URL ?? request.nextUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}/dashboard`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=Could+not+sign+in`);
}
