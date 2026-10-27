"use client";
import {useActionState} from 'react';
import {resources} from '../../../../lib/week7.mjs';
import {saveConfiguration} from './actions';
export default function ConfigForm({resource,record,providers=[],deleting=false}) {
 const [state,action,pending]=useActionState(saveConfiguration,null),spec=resources[resource];
 const operation=deleting?'delete':record.revision?'update':'create';
 return <form action={action} className="media-form">
  <input type="hidden" name="resource" value={resource}/><input type="hidden" name="operation" value={operation}/>
  <input type="hidden" name="id" value={record.id}/><input type="hidden" name="revision" value={record.revision??0}/>
  {deleting?<label>Type DELETE to confirm<input name="confirmation" pattern="DELETE" required disabled={pending}/></label>:
   spec.fields.map(f=><label key={f.key}>{f.label}{f.type==='textarea'?<textarea name={f.key} defaultValue={record[f.key]??''} maxLength={f.max} required={f.required} rows={4} disabled={pending}/>:
    f.type==='provider'?<select name={f.key} defaultValue={record[f.key]??''} required disabled={pending}><option value="">Choose provider</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>:
    <input name={f.key} type={f.type} defaultValue={record[f.key]??''} maxLength={f.type==='number'?undefined:f.max} min={f.min} max={f.type==='number'?f.max:undefined} step={f.type==='number'?1:undefined} required={f.required} disabled={pending}/>}</label>)}
  {state?.error&&<p role="alert" className="form-message">{state.error}</p>}
  <div><button disabled={pending}>{pending?'Saving…':deleting?'Delete record':operation==='create'?'Create record':'Save changes'}</button></div>
 </form>;
}
