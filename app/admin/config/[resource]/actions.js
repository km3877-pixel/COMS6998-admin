"use server";
import { requireAdmin } from '../../../../lib/auth/admin';
import { createClient } from '../../../../lib/supabase/server';
import { parseConfigForm } from '../../../../lib/week7.mjs';
import {listFilters} from '../../../../lib/management.mjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function saveConfiguration(previous,form) {
 await requireAdmin();
 let input; try {input=parseConfigForm(form);} catch(e) {return {error:e.message};}
 const {resource,operation,id,revision,data}=input;
 const {error}=await (await createClient()).rpc('admin_config_write',{p_resource:resource,p_operation:operation,p_id:id,p_revision:revision,p_data:data});
 if(error) return {error:({'40001':'Someone changed this record. Reload before saving.','23505':'A record with this name or identifier already exists.','23503':'This record is referenced by another record. Remove that dependency before deleting, or choose an existing reference.','23514':'Check the field values. The mix must keep at least one chain enabled.','P0002':'This record no longer exists. Refresh the list.','42501':'Your admin access has changed. Sign in again.'})[error.code]||'Could not confirm the save. Refresh before retrying.'};
 revalidatePath('/admin','layout');
 const {search,page}=listFilters({q:form.get('list_search'),page:form.get('list_page')});
 redirect(`/admin/config/${resource}?${new URLSearchParams({saved:operation,q:search,page:String(page)})}`);
}
