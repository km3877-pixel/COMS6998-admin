import GoogleSignIn from "./google-sign-in";
import { isConfigured } from "../../lib/supabase/config";

export const dynamic = "force-dynamic";
export default async function Login({ searchParams }) {
  const { error } = await searchParams;
  const configured = isConfigured();
  return <main className="auth-page">
    <h1>Punchline Admin</h1>
    <p>Sign in with your Google account.</p>
    <GoogleSignIn disabled={!configured} />
    {!configured ? <p className="notice" role="status">Sign-in is not configured yet. Contact the project owner to finish setup.</p> :
      error ? <p className="notice" role="alert">We couldn&apos;t complete sign-in. Please try again.</p> : null}
    <p className="muted">Access is limited to approved administrators. Contact the project owner if you need access.</p>
  </main>;
}
