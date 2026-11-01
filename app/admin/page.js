import { requireAdmin } from "../../lib/auth/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function Admin() {
  await requireAdmin();
  redirect("/admin/superusers");
}
