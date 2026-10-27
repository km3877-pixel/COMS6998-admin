"use client";
import { useActionState } from "react";
import { createMedia,updateMedia,deleteMedia } from "./actions";
import { styles } from "../../../lib/management.mjs";
function Message({state}) { return state?.error ? <p className="form-message" role="alert">{state.error}</p> : null; }
export function CreateForm({id,configured}) {
  const [state,action,pending]=useActionState(createMedia,null);
  return <form action={action} className="media-form">
    <input type="hidden" name="id" value={id}/>
    <label>Image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required disabled={pending || !configured}/></label>
    <small className="muted">Still JPEG, PNG or WebP, up to 3 MB. The image will be compressed for hosting.</small>
    <label>Image description<textarea name="alt" rows={2} maxLength={300} required disabled={pending || !configured}/></label>
    <Message state={state}/>
    <div className="button-row"><button disabled={pending || !configured}>{pending?"Generating captions and saving…":"Generate captions & save draft"}</button><a href="/admin/media">Cancel</a>{state?.error && <a href="/admin/media/new">Start a new request</a>}</div>
    {pending && <p role="status">This can take about 30 seconds. Keep this page open.</p>}
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
    <label className="check-label"><input type="checkbox" name="published" defaultChecked={media.published}/>Published in the consumer app</label>
    <Message state={state}/><div><button disabled={pending}>{pending?"Saving…":"Save changes"}</button></div>
  </form>;
}
export function DeleteForm({media}) {
  const [state,action,pending]=useActionState(deleteMedia,null);
  return <details className="danger-zone"><summary>Delete this post</summary>
    <p>This removes the post and its captions from the active app. Ratings, generation records, and the private image file are retained for audit history. There is no restore button.</p>
    <form action={action} className="media-form"><input name="id" type="hidden" value={media.id}/><input name="revision" type="hidden" value={media.revision}/>
      <label>Type DELETE to confirm<input name="confirmation" required pattern="DELETE" autoComplete="off"/></label><Message state={state}/>
      <div><button disabled={pending}>{pending?"Deleting…":"Delete post"}</button></div>
    </form>
  </details>;
}
