import { randomUUID } from "node:crypto";
import { requireAdmin } from "../../../../lib/auth/admin";
import { CreateForm } from "../media-forms";
export default async function NewMedia() {
  await requireAdmin();
  const configured=Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.GEMINI_API_KEY);
  return <section><a href="/admin/media">← Media</a><h2>Create media</h2>
    <p>Upload an image and generate dry, internet-voice, and college-twist captions. Review the saved draft before publishing.</p>
    {!configured && <p role="alert" className="notice">Creation is not configured yet. Add the server-only Supabase service-role key and Gemini API key to this app&apos;s environment.</p>}
    <CreateForm id={randomUUID()} configured={configured}/>
  </section>;
}
