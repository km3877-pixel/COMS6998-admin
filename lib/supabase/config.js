export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function clientOptions() {
  return {
    // Separate from the consumer app, including on localhost (cookies ignore ports).
    cookieOptions: { name: "punchline-admin-auth", sameSite: "lax", path: "/" },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) },
  };
}
