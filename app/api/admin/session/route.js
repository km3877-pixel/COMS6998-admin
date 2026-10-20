import { getAdminAccess } from "../../../../lib/auth/admin";

export const dynamic = "force-dynamic";
export async function GET() {
  const access = await getAdminAccess();
  const status = access.status === "authorized" ? 200 :
    access.status === "anonymous" ? 401 : access.status === "denied" ? 403 : 503;
  return Response.json(
    status === 200 ? { authorized: true } : { error: status === 401 ? "Sign in required" : status === 403 ? "Access denied" : "Access check unavailable" },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}
