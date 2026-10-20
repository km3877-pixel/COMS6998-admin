"use server";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isConfigured } from "../../lib/supabase/config";

// Public session cleanup, intentionally available to denied users too.
// No administrative data or privileges are accessed here.
export async function signOut() {
  if (isConfigured()) {
    const client = await createClient();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) redirect("/access-denied?error=sign_out");
  }
  redirect("/login");
}
