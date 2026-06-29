import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

// cache() dedupes per request: layout + page + nested components share one client
// (and one cookies() read) instead of constructing 3-4 independent ones per navigation.
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // ponytail: try/catch is required — setAll throws when called from a
          // Server Component (read-only). The proxy refreshes the session there.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ignore
          }
        },
      },
    },
  );
});

// Per-request memoized claims: middleware already validated/refreshed the token, so
// the layout + page reads collapse to one. Wrapped in cache() (same client ref → hit).
export const getClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data;
});
