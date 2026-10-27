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
  return <section><div className="section-header"><h2>Images</h2><a className="button" href="/admin/images/new">Upload image</a></div>
    <p className="muted">Browse uploaded and AI-generated images. Open an image to view it, edit its description and publication status, or delete it.</p>
    {params.deleted==="1" && <p role="status" className="notice">Post deleted. Its ratings and generation history are retained in the private audit archive.</p>}
    <form className="dashboard-filters"><SearchField search={search} placeholder="Description, caption or image ID"/><label>Status<select name="status" defaultValue={status}><option value="all">All images</option><option value="published">Published</option><option value="draft">Drafts</option></select></label><button>Apply filters</button>{(search||status!=='all')&&<a href="/admin/images">Clear filters</a>}</form>
    <div className="table-container"><table><thead><tr><th>Image / description</th><th>Status</th><th>Captions / votes</th><th>Action</th></tr></thead>
      <tbody>{data.rows.map(i=><tr key={i.id}><td><a className="media-list-link" href={`/admin/images/${i.id}`}><MediaImage id={i.id} thumbnail/><span>{i.alt_text}</span></a></td>
        <td><span className={`badge ${i.published?'positive':''}`}>{i.published?"Published":"Draft"}</span><br/><small>{i.ai_generated?"AI image":"Uploaded image"}</small><br/><small>{dateTime(i.created_at)}</small></td><td>{i.captions} active captions<br/>{i.votes} current votes</td><td><a className="row-action" href={`/admin/images/${i.id}`}>View / edit</a></td></tr>)}</tbody></table></div>
    {!data.rows.length && <div className="empty-state"><strong>No images found</strong><p>{search||status!=='all'?'Try a different search or clear the filters.':'Upload an image to add it to the library.'}</p><a href={search||status!=='all'?'/admin/images':'/admin/images/new'}>{search||status!=='all'?'Clear filters':'Upload image'}</a></div>}
    <Pagination path="/admin/images" params={{q:search,status}} page={page} total={data.total}/>
  </section>;
}
