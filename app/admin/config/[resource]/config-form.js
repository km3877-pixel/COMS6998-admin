"use client";
import {useActionState} from 'react';
import {resources} from '../../../../lib/week7.mjs';
import {saveConfiguration} from './actions';
import {resourceNames} from '../../../../lib/admin-navigation.mjs';
export default function ConfigForm({resource,record,providers=[],deleting=false,search='',page=1}) {
 const [state,action,pending]=useActionState(saveConfiguration,null),spec=resources[resource];
 const operation=deleting?'delete':record.revision?'update':'create';
 return <form action={action} className="media-form">
  <input type="hidden" name="resource" value={resource}/><input type="hidden" name="operation" value={operation}/>
  <input type="hidden" name="id" value={record.id}/><input type="hidden" name="revision" value={record.revision??0}/>
  <input type="hidden" name="list_search" value={search}/><input type="hidden" name="list_page" value={page}/>
  {deleting?<label>Type DELETE to confirm<input name="confirmation" pattern="DELETE" required disabled={pending}/></label>:
   spec.fields.map(f=><label key={f.key}>{f.label}{!f.required&&<span className="field-hint">Optional</span>}{f.type==='textarea'?<textarea name={f.key} defaultValue={record[f.key]??''} maxLength={f.max} required={f.required} rows={4} disabled={pending}/>:
    resource==='mix'?<select name={f.key} defaultValue={record[f.key]} disabled={pending}><option value="1">Include — generate one caption</option><option value="0">Exclude — do not generate</option></select>:
    f.type==='provider'?<select name={f.key} defaultValue={record[f.key]??''} required disabled={pending}><option value="">Choose provider</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>:
    <input name={f.key} type={f.type} defaultValue={record[f.key]??''} maxLength={f.type==='number'?undefined:f.max} min={f.min} max={f.type==='number'?f.max:undefined} step={f.type==='number'?1:undefined} required={f.required} disabled={pending}/>}</label>)}
  {state?.error&&<p role="alert" className="form-message">{state.error}</p>}
  {resource==='models'&&!providers.length&&<p role="alert">Add a <a href="/admin/config/providers?create=1">provider</a> before creating a model.</p>}
  <div className="button-row"><button disabled={pending||(!deleting&&resource==='models'&&!providers.length)}>{pending?'Saving…':deleting?`Delete ${resourceNames[resource]}`:operation==='create'?`Add ${resourceNames[resource]}`:'Save changes'}</button>
  {!deleting&&<a className="button secondary" href={`/admin/config/${resource}?${new URLSearchParams({q:search,page:String(page)})}`}>Cancel</a>}</div>
 </form>;
}
