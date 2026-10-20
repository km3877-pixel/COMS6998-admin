import { requireAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";
import { listFilters,dateTime,safeChoice,styles } from "../../../lib/management.mjs";
import { Pagination,LoadError,SearchField } from "../list-parts";
export default async function Ratings({searchParams}) {
  await requireAdmin();
  const params=await searchParams,{search,page}=listFilters(params);
  const mode=safeChoice(params.mode,["current","events","deleted"],"current"),value=safeChoice(params.value,["all","up","down","removed"],"all");
  const {data,error}=await (await createClient()).rpc("admin_ratings",{p_search:search,p_value:value,p_mode:mode,p_page:page});
  if(error || !data) return <LoadError/>;
  return <section><h2>Votes / ratings</h2><p className="muted">Ratings use upvotes (+1) and downvotes (−1). Current votes are the latest selections; history includes changes and removals.</p>
    <form className="dashboard-filters"><SearchField search={search}/>
      <label>Show<select name="mode" defaultValue={mode}><option value="current">Current votes</option><option value="events">Vote history</option><option value="deleted">Deleted-post history</option></select></label>
      <label>Rating<select name="value" defaultValue={value}><option value="all">All ratings</option><option value="up">Upvotes</option><option value="down">Downvotes</option><option value="removed">Removed votes</option></select></label><button>Apply</button>
    </form><div className="table-container"><table><thead><tr><th>Rating / date</th><th>Caption / post</th><th>User</th></tr></thead>
      <tbody>{data.rows.map((r,n)=><tr key={`${r.event_id}-${r.caption_id}-${r.user_id}-${n}`}><td><span className={`badge ${r.value===1?"positive":r.value===-1?"negative":""}`}>{r.value===1?"↑ Upvote":r.value===-1?"↓ Downvote":"Removed"}</span><br/>{dateTime(r.rated_at)}</td>
        <td className="caption-cell">{r.caption}<br/><small className="muted">{styles[r.style] || r.style}{!r.active && !r.deleted ? " · Earlier/inactive caption" : ""}</small><br/>
          {r.deleted ? <span>Deleted: {r.alt_text}</span> : <a href={`/admin/media/${r.image_id}`}>{r.alt_text}</a>}</td>
        <td>{r.name || "Incomplete profile"}<br/>{r.email || r.user_id}</td></tr>)}</tbody></table></div>
    {!data.rows.length && <p className="empty-state">No ratings match these filters.</p>}
    <Pagination path="/admin/ratings" params={{q:search,mode,value}} page={page} total={data.total}/>
  </section>;
}
