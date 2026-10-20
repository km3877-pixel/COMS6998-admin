import "server-only";
import { createClient } from "@supabase/supabase-js";
// Only call after requireAdmin/getAdminAccess. No user-supplied bucket or path.
export function storageAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Storage is not configured");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store"})},
  });
}
