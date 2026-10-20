"use client";
import { useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function GoogleSignIn({ disabled }) {
  const starting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    if (starting.current) return;
    starting.current = true;
    setPending(true);
    setError("");
    try {
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/auth/callback", window.location.origin).href,
          queryParams: { prompt: "select_account" },
          skipBrowserRedirect: true,
        },
      });
      if (!error && data?.url) { window.location.assign(data.url); return; }
    } catch { /* Keep provider details out of the UI. */ }
    setError("Sign-in could not start. Please try again.");
    starting.current = false;
    setPending(false);
  }
  return <>
    <button disabled={disabled || pending} onClick={signIn}>
      {pending ? "Opening Google..." : "Continue with Google"}
    </button>
    {error && <p className="notice" role="alert">{error}</p>}
    <noscript>Enable JavaScript to sign in with Google.</noscript>
  </>;
}
