"use client";
import { usePathname } from "next/navigation";
export default function AdminNav() {
  const path=usePathname();
  return <nav className="dashboard-menu main-menu" aria-label="Administration">
    {[["/admin","Statistics"],["/admin/users","Users"],["/admin/media","Images & AI media"],["/admin/ratings","Ratings"],["/admin/config/chains","Prompt chains"],["/admin/config/steps","Chain steps"],["/admin/config/mix","Chain mix"],["/admin/config/terms","Terms"],["/admin/config/examples","AI examples"],["/admin/config/models","LLM models"],["/admin/config/providers","LLM providers"],["/admin/observability/runs","Saved prompt runs"],["/admin/observability/requests","Generation requests"],["/admin/observability/responses","LLM responses"],["/admin/config/domains","Signup domains"],["/admin/config/emails","Email whitelist"],["/admin/superusers","Superusers"]].map(([href,label])=>
      <a key={href} href={href} aria-current={(href==="/admin" ? path===href : path.startsWith(href)) ? "page" : undefined}>{label}</a>)}
  </nav>;
}
