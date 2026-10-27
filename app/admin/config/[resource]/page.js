import {randomUUID} from 'node:crypto';
import {notFound} from 'next/navigation';
import {requireAdmin} from '../../../../lib/auth/admin';
import {createClient} from '../../../../lib/supabase/server';
import {resources} from '../../../../lib/week7.mjs';
import {isUuid,listFilters} from '../../../../lib/management.mjs';
import {LoadError,Pagination,SearchField} from '../../list-parts';
import ConfigForm from './config-form';

export default async function Configuration({params,searchParams}) {
 await requireAdmin();
 const {resource}=await params,spec=Object.hasOwn(resources,resource)?resources[resource]:null;
 if(!spec) notFound();
 const query=await searchParams,{search,page}=listFilters(query),client=await createClient();
 const {data,error}=await client.rpc('admin_config_list',{p_resource:resource,p_search:search,p_page:page});
 if(error||!data) return <LoadError/>;
 let selected=null,providers=[],context=null;
 if(query.edit && isUuid(query.edit)) {
  const result=await client.rpc('admin_config_record',{p_resource:resource,p_id:query.edit});
  if(result.error) return <LoadError/>;
  if(!result.data) notFound(); selected=result.data;
 }
 if(['models','chains','steps','mix'].includes(resource)) {
  const result=await client.rpc('admin_generation_config'); if(result.error) return <LoadError/>; context=result.data;
 }
 if(resource==='models') {
  let n=1,total=0; do {const result=await client.rpc('admin_config_list',{p_resource:'providers',p_search:'',p_page:n++});if(result.error)return <LoadError/>;providers.push(...result.data.rows);total=result.data.total;}while(providers.length<total);
 }
 const chains=Object.fromEntries((context?.chains??[]).map(c=>[c.id,c]));
 const path=`/admin/config/${resource}`;
 const label=row=>row.name??row.term??row.domain??row.email??chains[row.id]?.name??row.caption??row.id;
 return <section><h2>{spec.title}</h2><p className="muted">{spec.description}</p>
  {['create','update','delete'].includes(query.saved)&&<p role="status" className="notice">{query.saved==='delete'?'Record deleted.':'Changes saved.'}</p>}
  {selected&&!spec.readOnly&&<section className="config-editor"><h3>Edit {label(selected)}</h3><ConfigForm key={`${selected.id}:${selected.revision}`} resource={resource} record={selected} providers={providers}/><p><a href={path}>Close editor</a></p>
   {!spec.updateOnly&&<details className="danger-zone"><summary>Delete this record</summary><p>Delete this configuration record permanently. Saved generation history is retained.</p><ConfigForm resource={resource} record={selected} deleting/></details>}</section>}
  {!spec.readOnly&&!spec.updateOnly&&<details className="config-editor"><summary>Create record</summary><ConfigForm resource={resource} record={{id:randomUUID()}} providers={providers}/></details>}
  <form className="dashboard-filters"><SearchField search={search}/><button>Search</button></form>
  <div className="table-container"><table><thead><tr><th>Record</th><th>Details</th><th>Actions</th></tr></thead><tbody>
   {data.rows.map(row=><tr key={row.id}><td><strong>{label(row)}</strong><details><summary>ID</summary><code>{row.id}</code></details></td><td>
    {spec.fields.map(f=><div key={f.key}><strong>{f.label}: </strong><span className="record-value">{f.key==='chain_id'?chains[row[f.key]]?.name??row[f.key]:f.key==='provider_id'?providers.find(p=>p.id===row[f.key])?.name??row[f.key]:String(row[f.key]??'—')}</span></div>)}
    {resource==='chains'&&<details><summary>Read ordered steps</summary>{chains[row.id]?.steps?.map(s=><div key={s.id}><h4>{s.position}. {s.name}</h4><p className="record-value">{s.instructions}</p><p>{s.provider} / {s.model} · Temperature {s.temperature}</p></div>)}</details>}
   </td><td>{spec.readOnly?(resource==='chains'?<a href={`/admin/config/steps?q=${row.id}`}>View steps</a>:'Read-only'):<a href={`${path}?edit=${row.id}`}>Edit{!spec.updateOnly?' / delete':''}</a>}</td></tr>)}
  </tbody></table></div>
  {!data.rows.length&&<p className="empty-state">No matching records.</p>}
  <Pagination path={path} params={{q:search}} page={page} total={data.total}/>
 </section>;
}
