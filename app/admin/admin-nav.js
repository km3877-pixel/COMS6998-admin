"use client";
import { usePathname } from "next/navigation";
export default function AdminNav() {
  const path=usePathname();
  return <nav className="dashboard-menu main-menu" aria-label="Administration">
    {[["/admin","Statistics"],["/admin/users","Users"],["/admin/media","Media"],["/admin/ratings","Ratings"],["/admin/superusers","Superusers"]].map(([href,label])=>
      <a key={href} href={href} aria-current={(href==="/admin" ? path===href : path.startsWith(href)) ? "page" : undefined}>{label}</a>)}
  </nav>;
}
