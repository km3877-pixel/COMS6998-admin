export function Pagination({path,params,page,total}) {
  const count=Math.max(1,Math.ceil(total/20));
  const href=n=>`${path}?${new URLSearchParams({...params,page:String(n)})}`;
  return <nav className="pagination" aria-label="Pagination"><span>{total} results · Page {page} of {count}</span>
    {page>1 && <a className="button" href={href(page-1)}>Previous</a>}
    {page<count && <a className="button" href={href(page+1)}>Next</a>}
    {page>count && <a href={href(1)}>Back to first page</a>}
  </nav>;
}
export function LoadError() { return <section role="alert"><h2>Couldn&apos;t load this section</h2><p>Refresh to try again. Your access may have changed or the database may be temporarily unavailable.</p></section>; }
export function SearchField({search,placeholder="Name, text, email or ID"}) { return <label>Search<input name="q" defaultValue={search} maxLength={100} type="search" placeholder={placeholder} /></label>; }
