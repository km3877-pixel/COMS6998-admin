"use server";
import { requireAdmin } from "../../../lib/auth/admin";
import { createClient } from "../../../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function changeSuperuser(previous, form) {
  const actor = await requireAdmin();
  const email = form.get("email"), operation = form.get("operation");
  if (typeof email !== "string" || email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      !["grant", "revoke"].includes(operation) || form.get("confirmed") !== "yes") {
    return { error: "Enter an email address and confirm the access change." };
  }
  const { data, error } = await (await createClient()).rpc("admin_set_superuser", {
    p_email: email.trim(), p_enabled: operation === "grant",
  });
  if (error) {
    const messages = {
      P0002: "No matching account with a profile. Ask them to sign in with Google first.",
      "22023": "This account must have a confirmed email and Google sign-in.",
      "23514": "You cannot revoke the last superuser. Grant someone else access first.",
      "42501": "Your admin permission could not be verified. Refresh and sign in again.",
    };
    return { error: messages[error.code] || "Could not confirm the change. Refresh the list before trying again." };
  }
  revalidatePath("/admin", "layout");
  if (operation === "revoke" && data === actor.id) redirect("/access-denied");
  redirect(`/admin/superusers?changed=${operation}`);
}
