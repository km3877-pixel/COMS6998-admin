import { requireAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";
import { listFilters,dateTime } from "../../../lib/management.mjs";
import { Pagination,LoadError,SearchField } from "../list-parts";
export default async function Users({searchParams}) {
  await requireAdmin();
  const {search,page}=listFilters(await searchParams);
  const {data,error}=await (await createClient()).rpc("admin_profiles",{p_search:search,p_page:page});
  if(error || !data) return <LoadError/>;
  return <section><h2>Users / profiles</h2><p className="muted">Profile details and account activity. Read-only.</p>
    <form className="dashboard-filters"><SearchField search={search}/><button>Search</button></form>
    <div className="table-container"><table><thead><tr><th>User</th><th>Access</th><th>Posts / votes</th><th>Account activity</th></tr></thead>
      <tbody>{data.rows.map(u=><tr key={u.id}><td><strong>{[u.firstname,u.lastname].filter(Boolean).join(" ") || "Incomplete profile"}</strong><br/>{u.email || "No email"}<details><summary>User ID</summary><code>{u.id}</code></details></td>
        <td><span className="badge">{u.admin ? "Admin" : "User"}</span></td><td>{u.posts} posts · {u.votes} current votes<br/><a href={`/admin/ratings?q=${u.id}`}>View ratings</a></td>
        <td>Joined: {dateTime(u.created_at)}<br/>Last sign-in: {dateTime(u.last_sign_in_at)}</td></tr>)}</tbody></table></div>
    {!data.rows.length && <p className="empty-state">No matching profiles.</p>}
    <Pagination path="/admin/users" params={{q:search}} page={page} total={data.total}/>
  </section>;
}
