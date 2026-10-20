import { approval, dashboardHref } from "../../lib/dashboard.mjs";
import ActivityChart from "./activity-chart";
import FilterForm from "./filter-form";

const number = value => Number(value).toLocaleString("en-US");
function Thumbnail({ post }) {
  return post.published
    ? <img className="post-thumbnail" src={`/api/admin/media/${post.id}`} alt={post.alt_text} width="88" height="72" loading="lazy" />
    : <span className="unpublished-thumbnail">Unpublished</span>;
}
function Approval({ item }) {
  return <div className="approval-value"><strong>{approval(item)}</strong><span className="muted">{number(item.upvotes)} up / {number(item.downvotes)} down</span></div>;
}

export default function DashboardView({ data, range, page, view = "overview", detail = "overall", limit = 10 }) {
  const pages = Math.max(1, Math.ceil(data.style_image_count / 12));
  const sections = [["overview","Overview"],["activity","Activity"],["posts","Most-liked posts"],["styles","Caption styles"]];
  return <>
    <nav className="dashboard-menu" aria-label="Dashboard sections">
      {sections.map(([value,label])=><a key={value} href={dashboardHref(range,1,value,detail,limit)} aria-current={view===value?"page":undefined}>{label}</a>)}
    </nav>
    {view !== "overview" && <FilterForm>
      <input type="hidden" name="view" value={view} />
      <input type="hidden" name="page" value="1" />
      {view !== "activity" && <input type="hidden" name="range" value={range} />}
      {view === "activity" && <label>Date range<select name="range" defaultValue={range}>
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option>
      </select></label>}
      {view === "posts" && <label>Show<select name="limit" defaultValue={String(limit)}>
        <option value="5">Top 5 posts</option><option value="10">Top 10 posts</option>
      </select></label>}
      {view === "styles" && <label>Compare<select name="detail" defaultValue={detail}>
        <option value="overall">Overall approval</option><option value="images">Approval by image</option>
      </select></label>}
    </FilterForm>}
    {view === "overview" && <><div className="summary-grid" aria-label="All-time totals">
      {[["Total users",data.totals.users,"Registered profiles"],
        ["Total posts",data.totals.posts,`${number(data.totals.published_posts)} published · one image = one post`],
        ["Total votes",data.totals.votes,"Current upvotes and downvotes"]].map(([label,value,note]) =>
        <section className="stat-card" key={label}><h2>{label}</h2><strong>{number(value)}</strong><p>{note}</p></section>)}
    </div><section className="overview-intro"><h2>Statistics overview</h2><p className="muted">Choose a section above to explore activity, top posts, or caption-style approval.</p></section></>}
    {view === "activity" && <section aria-labelledby="activity-title">
      <div className="section-header"><h2 id="activity-title">Activity over time</h2>
      </div>
      <p className="muted helper">Daily counts in UTC, including today. Vote actions include new votes and changed votes; removals are listed in the daily table.</p>
      <ActivityChart rows={data.activity} />
    </section>}
    {view === "posts" && <section aria-labelledby="top-title">
      <h2 id="top-title">Most-liked posts</h2>
      <p className="muted helper">All-time published posts, ranked by upvotes minus downvotes across their captions. Shows the highest-scoring caption for each image.</p>
      {data.top_posts.length ? <div className="table-container"><table>
        <thead><tr><th scope="col">Post</th><th scope="col">Top caption</th><th scope="col">Up</th><th scope="col">Down</th><th scope="col">Net score</th></tr></thead>
        <tbody>{data.top_posts.slice(0,limit).map(p=><tr key={p.id}><td><Thumbnail post={p} /></td><th scope="row" className="caption-cell">{p.caption || p.alt_text}</th><td>{number(p.upvotes)}</td><td>{number(p.downvotes)}</td><td><strong>{number(p.upvotes-p.downvotes)}</strong></td></tr>)}</tbody>
      </table></div> : <p className="empty-state">No published posts have votes yet.</p>}
    </section>}
    {view === "styles" && <section aria-labelledby="styles-title">
      <h2 id="styles-title">Caption-style approval</h2>
      <p className="muted helper">All-time upvotes ÷ current votes, grouped by the three original humor styles. Includes votes on earlier caption versions. No-vote styles have no approval rate.</p>
      {detail === "overall" && <><div className="style-grid">{data.styles.map(s=><article className="style-card" key={s.style}><h3>{s.label}</h3>
        <Approval item={s} /><div className="approval-track" aria-hidden="true"><span style={{width:s.votes?`${s.upvotes/s.votes*100}%`:"0%"}} /></div>
        <p className="muted">{number(s.votes)} votes</p></article>)}</div>
      <p className="muted helper">{number(data.other_style_votes)} votes on human-written or on-demand captions are excluded from this comparison. Samples may be small and uneven.</p></>}
      {detail === "images" && <><h3>By image</h3><p className="muted helper">Images with all three original styles. Expand an image to see its captions.</p>
      {data.style_images.length ? <div className="table-container"><table className="style-table">
        <thead><tr><th scope="col">Image</th>{data.styles.map(s=><th scope="col" key={s.style}>{s.label}</th>)}</tr></thead>
        <tbody>{data.style_images.map(p=><tr key={p.id}><th scope="row"><Thumbnail post={p} /><details><summary>View captions</summary><div className="caption-details">
          {p.styles.map(s=><div key={s.style}><strong>{s.label}</strong>{s.captions.map((c,i)=><p key={i}>{c.text}{!c.active && <small> (Earlier version)</small>}</p>)}</div>)}
        </div></details></th>{p.styles.map(s=><td key={s.style}><Approval item={s} /></td>)}</tr>)}</tbody>
      </table></div> : <p className="empty-state">No images with all three styles on this page.</p>}
      <nav className="pagination" aria-label="Image comparison pages">
        {page>1 && <a className="button" href={dashboardHref(range,page-1,"styles","images",limit)}>Previous</a>}
        <span>Page {page} of {pages} · {number(data.style_image_count)} images</span>
        {page<pages && <a className="button" href={dashboardHref(range,page+1,"styles","images",limit)}>Next</a>}
      </nav></>}
    </section>}
    <p className="muted helper">Updated {new Date(data.generated_at).toLocaleString("en-US",{timeZone:"UTC"})} UTC.</p>
  </>;
}
