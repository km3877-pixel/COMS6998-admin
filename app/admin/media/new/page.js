import { randomUUID } from "node:crypto";
import { requireAdmin } from "../../../../lib/auth/admin";
import { CreateForm } from "../media-forms";
export default async function NewMedia() {
  await requireAdmin();
  const configured=Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),aiConfigured=Boolean(process.env.GEMINI_API_KEY);
  return <section><a href="/admin/images">← Images</a><h2>Upload image</h2>
    <p>Add an image to the library. Optionally generate captions using the current <a href="/admin/config/mix">prompt chain mix</a>. Review the saved draft before publishing.</p>
    {!configured && <p role="alert" className="notice">Image storage is not configured. Contact the administrator.</p>}
    <CreateForm id={randomUUID()} configured={configured} aiConfigured={aiConfigured}/>
  </section>;
}
