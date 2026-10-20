"use client";
import { createBrowserClient } from "@supabase/ssr";
import { clientOptions } from "./config";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    clientOptions(),
  );
}
