import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isConfigured } from "../../../lib/supabase/config";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const codes = params.getAll("code");
  let destination = "/login?error=sign_in_failed";
  if (isConfigured() && !params.has("error") && codes.length === 1 && codes[0].trim()) {
    try {
      const client = await createClient();
      const { data, error } = await client.auth.exchangeCodeForSession(codes[0]);
      if (!error && data?.session) destination = "/admin";
    } catch { /* Never log codes or tokens. */ }
  }
  return NextResponse.redirect(new URL(destination, request.url), {
    status: 303, headers: { "Cache-Control": "private, no-store" },
  });
}
