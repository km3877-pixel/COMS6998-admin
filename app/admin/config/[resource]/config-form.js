"use client";
import {useActionState,useState} from 'react';
import ModelHelp from './model-help';
import {resources} from '../../../../lib/week7.mjs';
import {saveConfiguration} from './actions';
import {resourceNames} from '../../../../lib/admin-navigation.mjs';
export default function ConfigForm({resource,record,providers=[],models=[],statuses=[],deleting=false,search='',page=1}) {
 const [state,action,pending]=useActionState(saveConfiguration,null),spec=resources[resource];
 const [providerId,setProviderId]=useState(record.provider_id??'');
 const chosenProvider=providers.find(p=>p.id===providerId),providerReadiness=statuses.find(s=>s.slug===chosenProvider?.slug);
 const operation=deleting?'delete':record.revision?'update':'create';
 return <form action={action} className="media-form">
  <input type="hidden" name="resource" value={resource}/><input type="hidden" name="operation" value={operation}/>
  <input type="hidden" name="id" value={record.id}/><input type="hidden" name="revision" value={record.revision??0}/>
  <input type="hidden" name="list_search" value={search}/><input type="hidden" name="list_page" value={page}/>
  {resource==='models'&&!deleting&&<ModelHelp/>}
  {deleting?<label>Type DELETE to confirm<input name="confirmation" pattern="DELETE" required disabled={pending}/></label>:
   spec.fields.filter(f=>resource!=='steps'||f.key==='model_id').map(f=><label key={f.key}>{f.label}{!f.required&&<span className="field-hint">Optional</span>}{f.type==='textarea'?<textarea name={f.key} defaultValue={record[f.key]??''} maxLength={f.max} required={f.required} rows={4} disabled={pending}/>:
    resource==='mix'?<select name={f.key} defaultValue={record[f.key]} disabled={pending}><option value="1">Include — generate one caption</option><option value="0">Exclude — do not generate</option></select>:
    f.type==='model'?<select name={f.key} defaultValue={record[f.key]??''} required disabled={pending}><option value="">Choose model</option>{models.map(m=><option key={m.id} value={m.id} disabled={!m.available}>{m.name} / {m.model_id} ({m.providerName}{m.available?'':', unavailable'})</option>)}</select>:
    f.type==='provider'?<select name={f.key} value={providerId} onChange={e=>setProviderId(e.target.value)} required disabled={pending}><option value="">Choose provider</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name} ({p.slug})</option>)}</select>:
    resource==='models'&&f.key==='model_id'?<><input name="model_id" defaultValue={record.model_id??''} maxLength={100} required disabled={pending} aria-describedby="model-id-help" autoCapitalize="none" autoCorrect="off" spellCheck={false}/><span id="model-id-help" className="field-hint">Copy the exact API model ID from the selected provider’s console. This is not the display name or provider identifier (such as openai). Choose a model with image input and structured JSON output support.</span></>:
    resource==='providers'&&f.key==='slug'?<><input name="slug" defaultValue={record.slug??''} maxLength={80} required disabled={pending} list="supported-provider-identifiers" aria-describedby="provider-identifier-help" autoCapitalize="none" autoCorrect="off" spellCheck={false}/><datalist id="supported-provider-identifiers"><option value="google_gemini">Google Gemini</option><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option></datalist><span id="provider-identifier-help" className="field-hint">Use the exact identifier for your provider:<br/>Google Gemini: <code>google_gemini</code><br/>OpenAI: <code>openai</code><br/>Anthropic: <code>anthropic</code><br/>Other identifiers are saved as registry entries only. A supported provider also needs its API key configured on the server before it can generate captions.</span></>:
    <input name={f.key} type={f.type} defaultValue={record[f.key]??''} maxLength={f.type==='number'?undefined:f.max} min={f.min} max={f.type==='number'?f.max:undefined} step={f.type==='number'?1:undefined} required={f.required} disabled={pending}/>}</label>)}
  {resource==='steps'&&<p className="field-hint">This changes future admin captions. The model must accept images and return structured JSON; model availability is verified when generation runs.</p>}
  {resource==='models'&&!deleting&&chosenProvider&&<p role="status" className="notice">{!providerReadiness?'This provider is registry-only: no caption-generation adapter is available.':providerReadiness.configured?'Provider credentials are configured. This model’s access and compatibility will be checked when generation runs.':<>This provider is unavailable. Add <code>{providerReadiness.environmentVariable}</code> securely to the admin app’s Vercel environment and redeploy. You can save this model now, but cannot select it for a prompt step until credentials are configured.</>}</p>}
  {state?.error&&<p role="alert" className="form-message">{state.error}</p>}
  {resource==='models'&&!providers.length&&<p role="alert">Add a <a href="/admin/config/providers?create=1">provider</a> before creating a model.</p>}
  <div className="button-row"><button disabled={pending||(!deleting&&resource==='models'&&!providers.length)}>{pending?'Saving…':deleting?`Delete ${resourceNames[resource]}`:operation==='create'?`Add ${resourceNames[resource]}`:'Save changes'}</button>
  {!deleting&&<a className="button secondary" href={`/admin/config/${resource}?${new URLSearchParams({q:search,page:String(page)})}`}>Cancel</a>}</div>
 </form>;
}
