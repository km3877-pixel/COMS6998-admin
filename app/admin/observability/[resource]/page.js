import {notFound} from 'next/navigation';
import {requireAdmin} from '../../../../lib/auth/admin';
import {createClient} from '../../../../lib/supabase/server';
import {listFilters,dateTime} from '../../../../lib/management.mjs';
import {safeRecord} from '../../../../lib/week7.mjs';
import {LoadError,Pagination,SearchField} from '../../list-parts';
const titles={runs:'Saved prompt runs',requests:'Generation requests',responses:'LLM responses'};
const sources={caption_request:'Caption request',image_request:'Image generation',admin_request:'Admin upload',caption_run:'Caption run',caption_batch:'Imported batch'};
function ResponseSummary({detail}) {
 const provenance=detail.details??detail.provenance??{};
 const steps=Array.isArray(provenance.steps)?provenance.steps:[];
 const responses=[detail.provider_response,provenance.response,...steps.map(s=>s.response)].filter(Boolean);
 const text=responses.flatMap(r=>r.candidates??[]).flatMap(c=>c.content?.parts??[]).filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('\n');
 const model=detail.model??provenance.model??steps[0]?.model;
 return <><div className="history-meta">{model&&<span><strong>Model:</strong> {model}</span>}{detail.error_code&&<span className="negative">Error: {detail.error_code}</span>}{provenance.ai_generation===false&&<span>Image upload · no AI generation</span>}{steps.length>0&&<span>{steps.length} recorded generation {steps.length===1?'step':'steps'}</span>}</div>
 {text&&<details><summary>Read generated output</summary><pre className="provenance">{text}</pre></details>}</>;
}
export default async function Observability({params,searchParams}) {
 await requireAdmin(); const {resource}=await params;if(!Object.hasOwn(titles,resource))notFound();
 const {search,page}=listFilters(await searchParams);
 const {data,error}=await (await createClient()).rpc('admin_observability',{p_resource:resource,p_search:search,p_page:page});
 if(error||!data)return <LoadError/>;
 return <section><div className="section-header"><h2>{titles[resource]}</h2><span className="badge">Read-only history</span></div><p className="muted">{resource==='requests'?'Check generation status and investigate failed requests.':resource==='responses'?'Inspect what the model returned and the prompts used.':'Review saved prompts and generation artifacts, including archived records.'} Older records may not include every detail.</p>
 <form className="dashboard-filters"><SearchField search={search} placeholder="Status, model, request or image ID"/><button>Search</button>{search&&<a href={`/admin/observability/${resource}`}>Clear search</a>}</form>
 <div className="table-container"><table><thead><tr><th>Record</th><th>Status / time</th><th>Prompts and output</th></tr></thead><tbody>{data.rows.map(r=><tr key={`${r.source}:${r.id}`}>
 <td><strong>{sources[r.source.replace('archived_','')]??r.source.replaceAll('_',' ')}</strong><details><summary>Record ID</summary><code>{r.id}</code></details>{r.image_id&&!r.source.startsWith('archived_')&&<p><a href={`/admin/images/${r.image_id}`}>View image</a></p>}</td>
 <td><span className={`badge ${r.status==='failed'?'negative':['succeeded','ready','shared'].includes(r.status)?'positive':''}`}>{r.status}</span><br/>{dateTime(r.created_at)}</td>
 <td><ResponseSummary detail={safeRecord(r.detail)}/><details><summary>Technical details &amp; raw data</summary><pre className="provenance">{JSON.stringify(safeRecord(r.detail),null,2)}</pre></details></td>
 </tr>)}</tbody></table></div>{!data.rows.length&&<p className="empty-state">No matching records.</p>}
 <Pagination path={`/admin/observability/${resource}`} params={{q:search}} page={page} total={data.total}/></section>;
}
