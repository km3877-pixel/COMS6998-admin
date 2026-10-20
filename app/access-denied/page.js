import { signOut } from "../auth/actions";

export const dynamic = "force-dynamic";
export default async function AccessDenied({ searchParams }) {
  const { error } = await searchParams;
  const unavailable = error === "unavailable";
  return <main className="message-layout"><section className="message-card">
    <h1>{unavailable ? "Access check unavailable" : "Access denied"}</h1>
    <p className="muted">{unavailable
      ? "We couldn’t verify your admin permission. Try again shortly or contact the project owner."
      : "Your account does not have access to this workspace. Ask the project owner to approve your Google account."}</p>
    {error === "sign_out" && <p role="alert">Sign-out failed. Please try again.</p>}
    <div className="button-row"><a className="button" href="/admin">Check access again</a>
      <form action={signOut}><button>Sign out / switch account</button></form></div>
  </section></main>;
}
