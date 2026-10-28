import {checkGenerationConfig} from '../../../../lib/provider-routing.mjs';
import {createClient} from '../../../../lib/supabase/server';
import { randomUUID } from "node:crypto";
import { requireAdmin } from "../../../../lib/auth/admin";
import { CreateForm } from "../media-forms";
export default async function NewMedia() {
  await requireAdmin();
  const configured=Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  let aiConfigured=false,configurationError='';
  const result=await (await createClient()).rpc('admin_generation_config');
  try {if(result.error)throw Error('Cannot read caption configuration.');checkGenerationConfig(result.data);aiConfigured=true;}catch(e){configurationError=e.message;}
  return <section><a href="/admin/images">← Images</a><h2>Upload image</h2>
    <p>Add an image to the library. Optionally generate captions using the current <a href="/admin/config/mix">prompt chain mix</a>. Review the saved draft before publishing.</p>
    {!configured && <p role="alert" className="notice">Image storage is not configured. Contact the administrator.</p>}
    {configurationError&&<p role="status" className="notice">{configurationError} You can still upload without captions.</p>}
    <CreateForm id={randomUUID()} configured={configured} aiConfigured={aiConfigured}/>
  </section>;
}
