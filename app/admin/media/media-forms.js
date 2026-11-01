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
  const canPublish=media.captions.some(c=>c.active);
  return <form action={action} className="media-form">
    <input name="id" type="hidden" value={media.id}/><input name="revision" type="hidden" value={media.revision}/>
    <label>Image description<textarea name="alt" defaultValue={media.alt_text} maxLength={300} rows={2} required/></label>
    {editable.map(c=><div key={c.id}><input type="hidden" name="caption_id" value={c.id}/>
      <label>{styles[c.style] || c.style}<textarea name={`caption_${c.id}`} defaultValue={c.text} maxLength={500} rows={3} required/></label>
      <small className="muted">{c.upvotes} upvotes · {c.downvotes} downvotes on this version</small></div>)}
    {media.captions.length>0 && <p className="helper muted">Changing a caption creates a new version. Existing votes stay with the previous text. User-written and personal on-demand captions remain read-only.</p>}
    {canPublish ? <div>
      <label className="check-label"><input type="checkbox" name="published" defaultChecked={media.published}/>Show in the consumer feed</label>
      <p className="helper muted">Select to publish, or clear to keep as a draft. Apply with Save changes.</p>
    </div> : <p className="notice"><strong>Draft only.</strong> This image has no active caption, so it cannot appear in the consumer feed. Saving the description keeps it as a draft; a description is not a caption.</p>}
    <Message state={state}/><div><button disabled={pending}>{pending?"Saving…":"Save changes"}</button></div>
  </form>;
}
export function DeleteForm({media}) {
  const [state,action,pending]=useActionState(deleteMedia,null);
  const [confirming,setConfirming]=useState(false);
  return <div className="danger-zone">
    {confirming ? <form action={action} className="media-form">
      <input name="id" type="hidden" value={media.id}/><input name="revision" type="hidden" value={media.revision}/>
      <p><strong>Are you sure you want to delete this image?</strong><br/>The image and its captions will be removed from the app. This cannot be undone here.</p>
      <Message state={state}/>
      <div className="button-row">
        <button type="submit" name="confirmation" value="DELETE" disabled={pending}>{pending?"Deleting…":"Yes, delete image"}</button>
        <button type="button" className="cancel-delete" disabled={pending} onClick={()=>setConfirming(false)}>Cancel</button>
      </div>
    </form> : <button type="button" onClick={()=>setConfirming(true)}>Delete image</button>}
  </div>;
}
