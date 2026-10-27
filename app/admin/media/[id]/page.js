import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/auth/admin";
import { createClient } from "../../../../lib/supabase/server";
import { isUuid,dateTime,styles } from "../../../../lib/management.mjs";
import { LoadError } from "../../list-parts";
import { EditForm,DeleteForm } from "../media-forms";
import MediaImage from "../media-image";
export default async function MediaDetail({params,searchParams}) {
  await requireAdmin();
  const {id}=await params;
  if(!isUuid(id)) notFound();
  const {data:media,error}=await (await createClient()).rpc("admin_media_detail",{p_id:id});
  if(error) return <LoadError/>;
  if(!media) notFound();
  const query=await searchParams;
  // Only fields required by forms cross the client boundary.
  const formMedia={id:media.id,revision:media.revision,alt_text:media.alt_text,published:media.published,
    captions:media.captions.map(({id,text,style,active,authored_by,generated_by,upvotes,downvotes})=>({id,text,style,active,authored_by,generated_by,upvotes,downvotes}))};
  return <section><a href="/admin/images">← Images</a><div className="section-header"><h2>View / edit image</h2><a href={`/admin/ratings?q=${id}`}>View ratings</a></div>
    {(query.saved==="1" || query.created==="1") && <p role="status" className="notice">{query.created==="1"?"Image uploaded and saved as a draft.":"Changes saved."}</p>}
    <span className="badge">{media.published?"Published":"Draft"}</span> <span className="muted">{dateTime(media.created_at)}</span><br/>
    {!media.published && !process.env.SUPABASE_SERVICE_ROLE_KEY
      ? <p className="notice">Draft image previews need the server-only Supabase key configured. You can still review and edit the caption records.</p>
      : <MediaImage id={id} alt={media.alt_text}/>}
    <EditForm key={media.revision} media={formMedia}/>
    <details><summary>All caption versions ({media.captions.length})</summary>
      {media.captions.map(c=><article className="style-card" key={c.id}><strong>{styles[c.style] || c.style} · {c.active?"Active":"Earlier version"}</strong><p>{c.text}</p><p>{c.upvotes} upvotes · {c.downvotes} downvotes</p><code>{c.id}</code></article>)}
    </details>
    <details><summary>Record information & generation provenance</summary>
      <p className="helper">Image ID: <code>{id}</code><br/>Uploader: <code>{media.uploaded_by || "Curated import"}</code></p>
      <pre className="provenance">{JSON.stringify({image:media.provenance,captions:media.captions.map(c=>({id:c.id,provenance:c.provenance})),changes:media.history},null,2)}</pre>
    </details>
    <DeleteForm key={`delete-${media.revision}`} media={{id,revision:media.revision}}/>
  </section>;
}
