"use server";
import { requireAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";
import { storageAdmin } from "../../../lib/supabase/storage-admin";
import { isUuid } from "../../../lib/management.mjs";
import { prepareImage,generateCaptions } from "../../../lib/admin-generation.mjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function failure(error) {
  const messages={
    "40001":"This post changed while you were editing. Reload it before saving.",
    "42501":"Admin access could not be verified. Sign in again.",
    "P0002":"This post no longer exists.",
    "55000":"A generation is still pending for this post. Retry after it completes.",
    "55P03":"This post is busy. Please try again shortly.",
  };
  return {error:messages[error?.code] || "The change could not be saved. Refresh and try again."};
}
function identifiers(form) {
  const id=form.get("id"),revision=Number(form.get("revision"));
  return isUuid(id) && Number.isSafeInteger(revision) && revision>=0 ? {id,revision} : null;
}
export async function updateMedia(previous,form) {
  await requireAdmin();
  const input=identifiers(form),alt=form.get("alt");
  if(!input || typeof alt!=="string" || !alt.trim() || alt.trim().length>300) return {error:"Enter a description (1–300 characters)."};
  const ids=form.getAll("caption_id");
  if(ids.length>3 || ids.some(id=>!isUuid(id))) return {error:"Invalid captions. Reload this page."};
  const captions=ids.map(id=>({id,text:form.get(`caption_${id}`)}));
  if(captions.some(c=>typeof c.text!=="string" || !c.text.trim() || c.text.trim().length>500)) return {error:"Each caption must contain 1–500 characters."};
  const {error}=await (await createClient()).rpc("admin_update_media",{p_id:input.id,p_revision:input.revision,p_alt:alt.trim(),p_published:form.get("published")==="on",p_captions:captions});
  if(error) return failure(error);
  revalidatePath("/admin","layout");
  redirect(`/admin/media/${input.id}?saved=1`);
}
export async function deleteMedia(previous,form) {
  await requireAdmin();
  const input=identifiers(form);
  if(!input || form.get("confirmation")!=="DELETE") return {error:"Type DELETE to confirm deletion."};
  const {error}=await (await createClient()).rpc("admin_delete_media",{p_id:input.id,p_revision:input.revision,p_confirmation:"DELETE"});
  if(error) return failure(error);
  revalidatePath("/admin","layout");
  redirect("/admin/media?deleted=1");
}
export async function createMedia(previous,form) {
  await requireAdmin();
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.GEMINI_API_KEY) return {error:"Creation needs the server-only Supabase and Gemini keys configured in .env.local."};
  const id=form.get("id"),alt=form.get("alt"),file=form.get("image");
  if(!isUuid(id) || typeof alt!=="string" || !alt.trim() || alt.trim().length>300 || !(file instanceof File) || !file.size || file.size>3*1024*1024) return {error:"Choose a still JPEG, PNG or WebP under 3 MB and enter a description."};
  let image;
  try { image=await prepareImage(Buffer.from(await file.arrayBuffer())); }
  catch { return {error:"This image could not be read. Use a still JPEG, PNG or WebP under 3 MB and 24 megapixels."}; }
  const client=await createClient();
  const reserved=await client.rpc("admin_reserve_media",{p_id:id});
  if(reserved.error) return {error:"This request was already submitted or the creation limit was reached. Check Media, then start a new request. Allow 30 seconds between requests (20 per day)."};
  let generated;
  try { generated=await generateCaptions(image.bytes,{apiKey:process.env.GEMINI_API_KEY}); }
  catch { return {error:"The AI provider could not generate captions. Start a new request to try again."}; }
  // Recheck live membership after the provider call, before privileged Storage.
  await requireAdmin();
  try {
    const {error}=await storageAdmin().storage.from("caption-images").upload(`admin/${id}.webp`,image.bytes,{contentType:"image/webp",upsert:false});
    if(error) return {error:"Image upload failed. Start a new request to retry."};
    const result=await client.rpc("admin_create_media",{p_id:id,p_alt:alt.trim(),p_source_hash:image.sourceHash,p_hosted_hash:image.hostedHash,
      p_bytes:image.bytes.length,p_captions:generated.captions,p_provenance:generated.provenance});
    // Never delete an uploaded object on an ambiguous DB/network error: the
    // transaction may have committed. Retain the private artifact for recovery.
    if(result.error) return {error:"Could not confirm the draft was saved. Check Media before starting a new request."};
  } catch { return {error:"Could not confirm the draft was saved. Check Media before retrying."}; }
  revalidatePath("/admin","layout");
  redirect(`/admin/media/${id}?created=1`);
}
