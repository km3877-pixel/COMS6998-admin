import {providerStatus} from '../../../../lib/provider-routing.mjs';
import {randomUUID} from 'node:crypto';
import {notFound} from 'next/navigation';
import {requireAdmin} from '../../../../lib/auth/admin';
import {createClient} from '../../../../lib/supabase/server';
import {resources} from '../../../../lib/week7.mjs';
import {isUuid,listFilters} from '../../../../lib/management.mjs';
import {LoadError,Pagination,SearchField} from '../../list-parts';
import ConfigForm from './config-form';
import ModelHelp from './model-help';
import {resourceNames} from '../../../../lib/admin-navigation.mjs';

export default async function Configuration({params,searchParams}) {
 await requireAdmin();
 const {resource}=await params,spec=Object.hasOwn(resources,resource)?resources[resource]:null;
 if(!spec) notFound();
 const query=await searchParams,{search,page}=listFilters(query),client=await createClient();
 const {data,error}=await client.rpc('admin_config_list',{p_resource:resource,p_search:search,p_page:page});
 if(error||!data) return <LoadError/>;
 let selected=null,providers=[],models=[],context=null;
 if(query.edit && isUuid(query.edit)) {
  const result=await client.rpc('admin_config_record',{p_resource:resource,p_id:query.edit});
  if(result.error) return <LoadError/>;
  if(!result.data) notFound(); selected=result.data;
 }
 if(['models','chains','steps','mix'].includes(resource)) {
  const result=await client.rpc('admin_generation_config'); if(result.error) return <LoadError/>; context=result.data;
 }
 if(['models','steps'].includes(resource)) {
  let n=1,total=0; do {const result=await client.rpc('admin_config_list',{p_resource:'providers',p_search:'',p_page:n++});if(result.error)return <LoadError/>;providers.push(...result.data.rows);total=result.data.total;}while(providers.length<total);
 }
 const statuses=providerStatus();
 if(resource==='steps') {
  let n=1,total=0; do {const result=await client.rpc('admin_config_list',{p_resource:'models',p_search:'',p_page:n++});if(result.error)return <LoadError/>;models.push(...result.data.rows);total=result.data.total;}while(models.length<total);
  models=models.map(m=>{const p=providers.find(p=>p.id===m.provider_id),status=statuses.find(s=>s.slug===p?.slug);return {...m,providerName:p?.name??'Unknown',available:status?.configured??false};});
 }
 const chains=Object.fromEntries((context?.chains??[]).map(c=>[c.id,c]));
 const path=`/admin/config/${resource}`;
 const listQuery=new URLSearchParams({q:search,page:String(page)}).toString();
 const back=`${path}?${listQuery}`;
 const noun=resourceNames[resource];
 const label=row=>row.name??row.term??row.domain??row.email??chains[row.id]?.name??row.caption??row.id;
 const creating=query.create==='1'&&!selected&&!spec.readOnly&&!spec.updateOnly;
 if((selected&&!spec.readOnly)||creating) return <section className="editor-page">
  <a className="back-link" href={back}>← Back to {spec.title.toLowerCase()}</a>
  <h2>{creating?`Add ${noun}`:`Edit ${noun}`}</h2>
  <p className="muted">{creating?spec.description:label(selected)}</p>
  {resource==='steps'&&<><p className="record-value">{selected.instructions}</p><p>Step {selected.position} · Configured temperature {selected.temperature}</p></>}
  <ConfigForm key={selected?`${selected.id}:${selected.revision}`:'new'} resource={resource} record={selected??{id:randomUUID()}} providers={providers} models={models} statuses={statuses} search={search} page={page}/>
  {selected&&!spec.updateOnly&&<details className="danger-zone"><summary>Delete {noun}</summary><p>This permanently removes this {noun}. Saved generation history is retained.</p><ConfigForm resource={resource} record={selected} deleting search={search} page={page}/></details>}
 </section>;
 const display=(row,f)=>f.key==='chain_id'?chains[row[f.key]]?.name??row[f.key]:f.key==='provider_id'?providers.find(p=>p.id===row[f.key])?.name??row[f.key]:f.key==='model_id'&&resource==='steps'?context?.chains.flatMap(c=>c.steps??[]).find(s=>s.model_id===row[f.key])?.model??row[f.key]:String(row[f.key]??'—');
 return <section><div className="section-header"><h2>{spec.title}</h2>
  {!spec.readOnly&&!spec.updateOnly?<a className="button" href={`${path}?create=1&${listQuery}`}>Add {noun}</a>:<span className="badge">{spec.readOnly?'Read-only':'Applies to new admin uploads'}</span>}</div><p className="muted">{spec.description}</p>
  {resource==='providers'&&<div className="notice">{statuses.map(s=><section key={s.slug} aria-labelledby={`provider-${s.slug}`}>
   <h3 id={`provider-${s.slug}`}>{s.name} <code>{s.slug}</code></h3>
   {s.configured?<p>Credentials configured. Access to the selected model is checked when generation runs.</p>:<>
    <p><strong>Unavailable — API key missing.</strong> To enable this provider:</p>
    <ol><li>Add <code>{s.environmentVariable}</code> securely to this admin app’s Vercel environment variables.</li><li>Redeploy the admin app so it receives the new key.</li><li>Add a compatible image-capable model in <a href="/admin/config/models?create=1">LLM models</a>, then select it in <a href="/admin/config/steps">Prompt chain steps</a>.</li></ol>
    <p>Until the key is configured, this provider’s models cannot be selected for a prompt step. Keep API keys out of provider records.</p>
    <p className="field-hint">This integration has automated tests using simulated API responses. Those tests do not verify a live connection to your account.</p>
   </>}
  </section>)}</div>}
  {resource==='models'&&<ModelHelp/>}
  {['create','update','delete'].includes(query.saved)&&<p role="status" className="notice">{query.saved==='delete'?'Record deleted.':'Changes saved.'}</p>}
  <form className="dashboard-filters"><SearchField search={search} placeholder={`Search ${spec.title.toLowerCase()}`}/><button>Search</button>{search&&<a href={path}>Clear search</a>}</form>
  <div className="table-container"><table><thead><tr><th>{resource==='mix'?'Prompt chain':'Name / entry'}</th><th>{resource==='mix'?'Generation':'Details'}</th><th>Action</th></tr></thead><tbody>
   {data.rows.map(row=><tr key={row.id}><td><strong>{label(row)}</strong><details><summary>ID</summary><code>{row.id}</code></details></td><td>
    {resource==='mix'?<span className={`badge ${row.caption_count?'positive':''}`}>{row.caption_count?'Included · 1 caption':'Excluded · 0 captions'}</span>:
     spec.fields.filter(f=>!['name','term','domain','email','caption'].includes(f.key)).map(f=><div className="record-field" key={f.key}>{f.type==='textarea'?<><span className="muted">{f.label}</span><p className="record-value">{display(row,f).slice(0,160)||'Not provided'}{display(row,f).length>160?'…':''}</p>{display(row,f).length>160&&<details><summary>Read full {f.label.toLowerCase()}</summary><p className="record-value">{display(row,f)}</p></details>}</>:<><span className="muted">{f.label}: </span><span className="record-value">{display(row,f)}</span></>}</div>)}
    {['domains','emails'].includes(resource)&&<span className="muted">Signup allowlist entry</span>}
    {resource==='models'&&(()=>{const provider=providers.find(p=>p.id===row.provider_id),status=statuses.find(s=>s.slug===provider?.slug);return <p className="field-hint">{!status?'Registry only — unsupported provider.':status.configured?'Provider credentials configured; model access checked at generation.':<>Unavailable — missing <code>{status.environmentVariable}</code>. <a href="/admin/config/providers">View setup instructions</a>.</>}</p>;})()}
    {resource==='chains'&&<details><summary>Read ordered steps</summary>{chains[row.id]?.steps?.map(s=><div key={s.id}><h4>{s.position}. {s.name}</h4><p className="record-value">{s.instructions}</p><p>{s.provider} / {s.model} · Temperature {s.temperature}</p></div>)}</details>}
   </td><td>{spec.readOnly?(resource==='chains'?<a href={`/admin/config/steps?q=${row.id}`}>View steps</a>:<span className="muted">Read-only</span>):<a className="row-action" aria-label={`Edit ${label(row)}`} href={`${path}?edit=${row.id}&${listQuery}`}>Edit</a>}</td></tr>)}
  </tbody></table></div>
  {!data.rows.length&&<div className="empty-state"><strong>{search?'No matching results':`No ${spec.title.toLowerCase()} yet`}</strong><p>{search?'Try a different search or clear the filter.':spec.readOnly?'No entries have been recorded.':`Use Add ${noun} to create your first entry.`}</p>{search&&<a href={path}>Clear search</a>}</div>}
  <Pagination path={path} params={{q:search}} page={page} total={data.total}/>
 </section>;
}
