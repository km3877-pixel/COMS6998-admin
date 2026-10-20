import { requireAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";
import { listFilters,dateTime,safeChoice } from "../../../lib/management.mjs";
import { Pagination,LoadError,SearchField } from "../list-parts";
import MediaImage from "./media-image";
export default async function Media({searchParams}) {
  await requireAdmin();
  const params=await searchParams,{search,page}=listFilters(params),status=safeChoice(params.status,["all","published","draft"],"all");
  const {data,error}=await (await createClient()).rpc("admin_media_list",{p_search:search,p_status:status,p_page:page});
  if(error || !data) return <LoadError/>;
  return <section><div className="section-header"><h2>Media</h2><a className="button" href="/admin/media/new">Create media</a></div>
    <p className="muted">Manage image posts and their AI captions.</p>
    {params.deleted==="1" && <p role="status" className="notice">Post deleted. Its ratings and generation history are retained in the private audit archive.</p>}
    <form className="dashboard-filters"><SearchField search={search}/><label>Status<select name="status" defaultValue={status}><option value="all">All posts</option><option value="published">Published</option><option value="draft">Drafts</option></select></label><button>Apply</button></form>
    <div className="table-container"><table><thead><tr><th>Image / description</th><th>Status</th><th>Captions / votes</th><th>Created</th></tr></thead>
      <tbody>{data.rows.map(i=><tr key={i.id}><td><a className="media-list-link" href={`/admin/media/${i.id}`}><MediaImage id={i.id} thumbnail/><span>{i.alt_text}</span></a></td>
        <td><span className="badge">{i.published?"Published":"Draft"}</span><br/><small>{i.ai_generated?"AI image":"Uploaded image"}</small></td><td>{i.captions} active captions<br/>{i.votes} current votes</td><td>{dateTime(i.created_at)}</td></tr>)}</tbody></table></div>
    {!data.rows.length && <p className="empty-state">No matching media. Try a different search or create a post.</p>}
    <Pagination path="/admin/media" params={{q:search,status}} page={page} total={data.total}/>
  </section>;
}
