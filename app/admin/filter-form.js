"use client";

export default function FilterForm({ children }) {
  return <form action="/admin" method="get" className="dashboard-filters" onChange={event => event.currentTarget.requestSubmit()}>
    {children}
    <noscript><button type="submit">Apply</button></noscript>
  </form>;
}
