import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { clientOptions, isConfigured } from "./lib/supabase/config";

export async function proxy(request) {
  let response = NextResponse.next({ request });
  if (isConfigured()) {
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        ...clientOptions(),
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(values) {
            values.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );
    try { await client.auth.getClaims(); } catch {
      // The page/API guard independently verifies access and fails closed.
    }
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/", "/login", "/access-denied", "/admin/:path*", "/api/:path*", "/auth/:path*"],
};
