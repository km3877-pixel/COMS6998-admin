import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { isConfigured } from "../supabase/config";
import { checkAccess } from "./check-access.mjs";

export async function getAdminAccess() {
  if (!isConfigured()) return { status: "unconfigured" };
  return checkAccess(await createClient(), {
    report: diagnostic => console.warn("[admin-access]", JSON.stringify(diagnostic)),
  });
}

// Call at each page/data boundary, and again in every future action/media route.
export async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "anonymous") redirect("/login");
  if (access.status === "unconfigured") redirect("/login?error=setup");
  if (access.status === "unavailable") redirect("/access-denied?error=unavailable");
  if (access.status !== "authorized") redirect("/access-denied");
  return access.user;
}
