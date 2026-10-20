"use client";
import { useActionState } from "react";
import { changeSuperuser } from "./actions";

export default function AccessForm({ email, self = false }) {
  const [state, action, pending] = useActionState(changeSuperuser, null);
  const revoke = Boolean(email);
  return <form action={action} className="media-form">
    <input type="hidden" name="operation" value={revoke ? "revoke" : "grant"}/>
    {revoke ? <input type="hidden" name="email" value={email}/> :
      <label>Google account email<input type="email" name="email" required maxLength={254} placeholder="name@columbia.edu" disabled={pending}/></label>}
    <label className="check-label"><input type="checkbox" name="confirmed" value="yes" required disabled={pending}/>
      {revoke ? `Remove ${self ? "my" : "this account's"} admin access` : "Grant full admin access, including managing other superusers"}
    </label>
    {self && <p className="helper">You will lose access to the admin panel immediately.</p>}
    {state?.error && <p role="alert" className="form-message">{state.error}</p>}
    <div><button disabled={pending}>{pending ? "Saving..." : revoke ? "Revoke access" : "Grant superuser access"}</button></div>
  </form>;
}
