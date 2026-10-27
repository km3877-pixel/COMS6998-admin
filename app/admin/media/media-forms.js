"use client";
import { useActionState,useState } from "react";
import { createMedia,updateMedia,deleteMedia } from "./actions";
import { styles } from "../../../lib/management.mjs";
function Message({state}) { return state?.error ? <p className="form-message" role="alert">{state.error}</p> : null; }
export function CreateForm({id,configured,aiConfigured=false}) {
  const [state,action,pending]=useActionState(createMedia,null);
  const [generate,setGenerate]=useState(false);
  return <form action={action} className="media-form">
    <input type="hidden" name="id" value={id}/>
    <label>Image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required disabled={pending || !configured}/></label>
    <small className="muted">Still JPEG, PNG or WebP, up to 3 MB. The image will be compressed for hosting.</small>
    <label>Image description<textarea name="alt" rows={2} maxLength={300} required disabled={pending || !configured}/></label>
    <label className="check-label"><input type="checkbox" name="generate" checked={generate} onChange={e=>setGenerate(e.target.checked)} disabled={pending || !configured || !aiConfigured}/>Generate AI captions (optional)</label>
    <p className="helper muted">Uploads without captions are saved as drafts. A caption is required before an image can be published in the consumer feed.</p>
    {!aiConfigured&&<p className="helper muted">AI captions are currently unavailable. Image uploads are still supported.</p>}
    <Message state={state}/>
    <div className="button-row"><button disabled={pending || !configured}>{pending?(generate?"Generating captions and uploading…":"Uploading…"):(generate?"Upload image & generate captions":"Upload image")}</button><a href="/admin/images">Cancel</a>{state?.error && <a href="/admin/images/new">Start a new request</a>}</div>
    {pending && <p role="status">{generate?"This can take about 30 seconds. ":""}Keep this page open.</p>}
  </form>;
}
export function EditForm({media}) {
  const [state,action,pending]=useActionState(updateMedia,null);
  const editable=media.captions.filter(c=>c.active && !c.authored_by && !c.generated_by);
  return <form action={action} className="media-form">
    <input name="id" type="hidden" value={media.id}/><input name="revision" type="hidden" value={media.revision}/>
    <label>Image description<textarea name="alt" defaultValue={media.alt_text} maxLength={300} rows={2} required/></label>
    {editable.map(c=><div key={c.id}><input type="hidden" name="caption_id" value={c.id}/>
      <label>{styles[c.style] || c.style}<textarea name={`caption_${c.id}`} defaultValue={c.text} maxLength={500} rows={3} required/></label>
      <small className="muted">{c.upvotes} upvotes · {c.downvotes} downvotes on this version</small></div>)}
    <p className="helper muted">Changing a caption creates a new version. Existing votes stay with the previous text. User-written and personal on-demand captions remain read-only.</p>
    <label className="check-label"><input type="checkbox" name="published" defaultChecked={media.published} disabled={!media.captions.some(c=>c.active)}/>Published in the consumer app</label>
    {!media.captions.some(c=>c.active)&&<p className="helper muted">This image has no captions and stays a draft. You can edit its description or delete it.</p>}
    <Message state={state}/><div><button disabled={pending}>{pending?"Saving…":"Save changes"}</button></div>
  </form>;
}
export function DeleteForm({media}) {
  const [state,action,pending]=useActionState(deleteMedia,null);
  return <details className="danger-zone"><summary>Delete image</summary>
    <p>This removes the post and its captions from the active app. Ratings, generation records, and the private image file are retained for audit history. There is no restore button.</p>
    <form action={action} className="media-form"><input name="id" type="hidden" value={media.id}/><input name="revision" type="hidden" value={media.revision}/>
      <label>Type DELETE to confirm<input name="confirmation" required pattern="DELETE" autoComplete="off"/></label><Message state={state}/>
      <div><button disabled={pending}>{pending?"Deleting…":"Delete image"}</button></div>
    </form>
  </details>;
}
