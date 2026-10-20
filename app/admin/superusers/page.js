import { requireAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";
import { dateTime } from "../../../lib/management.mjs";
import { LoadError } from "../list-parts";
import AccessForm from "./access-form";

export default async function Superusers({ searchParams }) {
  const actor = await requireAdmin();
  const { data, error } = await (await createClient()).rpc("admin_superusers");
  if (error || !Array.isArray(data)) return <LoadError/>;
  const { changed } = await searchParams;
  return <>
    <section>
      <h2>Superusers</h2>
      <p className="muted">Superusers can view admin data, manage media, and grant or revoke admin access. Google sign-in is required.</p>
      {["grant", "revoke"].includes(changed) && <p role="status" className="form-message">Access {changed === "grant" ? "granted" : "revoked"} successfully.</p>}
      <div className="table-container"><table>
        <thead><tr><th>Account</th><th>Access granted</th><th>Manage access</th></tr></thead>
        <tbody>{data.map(user => <tr key={user.id}>
          <td><strong>{user.name || user.email}</strong><br/>{user.email}
            {user.id === actor.id && <> <span className="badge">You</span></>}</td>
          <td>{dateTime(user.granted_at)}</td>
          <td>{data.length === 1 ? <span className="muted">Last superuser — grant another account access before revoking.</span> :
            <details className="access-revoke"><summary>Revoke access</summary>
              <AccessForm email={user.email} self={user.id === actor.id}/>
            </details>}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section><h2>Add a superuser</h2>
      <p className="muted">Enter the exact email of an existing user who has signed in with Google. Access changes take effect on the next request.</p>
      <AccessForm/>
    </section>
  </>;
}
