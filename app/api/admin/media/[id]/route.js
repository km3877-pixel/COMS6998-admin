import { getAdminAccess } from "../../../../../lib/auth/admin";
import { createClient } from "../../../../../lib/supabase/server";
import { storageAdmin } from "../../../../../lib/supabase/storage-admin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(request, { params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return new Response("Access denied", { status: access.status === "anonymous" ? 401 : access.status === "denied" ? 403 : 503, headers });
  }
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response("Not found", { status: 404, headers });
  const client = await createClient();
  const { data: image, error } = await client.rpc("admin_media_detail",{p_id:id});
  if (error || !image) return new Response("Not found", { status: 404, headers });
  // The path comes from an admin-checked DB record, never a URL/path supplied by
  // the browser. Fall back to existing published-image RLS before setup.
  const storage=process.env.SUPABASE_SERVICE_ROLE_KEY ? storageAdmin().storage : client.storage;
  const { data, error: storageError } = await storage.from("caption-images").download(image.storage_path);
  if (storageError || !data) return new Response("Image unavailable", { status: 404, headers });
  return new Response(data, { headers: { ...headers, "Content-Type": "image/webp" } });
}
