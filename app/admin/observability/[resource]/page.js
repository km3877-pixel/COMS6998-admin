import {notFound} from 'next/navigation';
import {requireAdmin} from '../../../../lib/auth/admin';
import {createClient} from '../../../../lib/supabase/server';
import {listFilters,dateTime} from '../../../../lib/management.mjs';
import {safeRecord} from '../../../../lib/week7.mjs';
import {LoadError,Pagination,SearchField} from '../../list-parts';
const titles={runs:'Saved prompt runs',requests:'Generation requests',responses:'LLM responses'};
export default async function Observability({params,searchParams}) {
 await requireAdmin(); const {resource}=await params;if(!Object.hasOwn(titles,resource))notFound();
 const {search,page}=listFilters(await searchParams);
 const {data,error}=await (await createClient()).rpc('admin_observability',{p_resource:resource,p_search:search,p_page:page});
 if(error||!data)return <LoadError/>;
 return <section><h2>{titles[resource]}</h2><p className="muted">Read-only generation history, including archived records. Older imported runs retain their original artifact format; a missing response means it was not recorded.</p>
 <form className="dashboard-filters"><SearchField search={search}/><button>Search</button></form>
 <div className="table-container"><table><thead><tr><th>Record</th><th>Status / time</th><th>Prompts and output</th></tr></thead><tbody>{data.rows.map(r=><tr key={`${r.source}:${r.id}`}>
 <td>{r.source.replaceAll('_',' ')}<br/><code>{r.id}</code>{r.image_id&&!r.source.startsWith('archived_')&&<p><a href={`/admin/media/${r.image_id}`}>View image</a></p>}</td>
 <td><span className="badge">{r.status}</span><br/>{dateTime(r.created_at)}</td>
 <td><details><summary>View recorded details</summary><pre className="provenance">{JSON.stringify(safeRecord(r.detail),null,2)}</pre></details></td>
 </tr>)}</tbody></table></div>{!data.rows.length&&<p className="empty-state">No matching records.</p>}
 <Pagination path={`/admin/observability/${resource}`} params={{q:search}} page={page} total={data.total}/></section>;
}
