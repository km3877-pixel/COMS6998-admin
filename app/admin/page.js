import { requireAdmin } from "../../lib/auth/admin";
import { createClient } from "../../lib/supabase/server";
import { dashboardFilters, dashboardViewOptions } from "../../lib/dashboard.mjs";
import DashboardView from "./dashboard-view";
import { redirect } from "next/navigation";
import { dashboardHref } from "../../lib/dashboard.mjs";

export const dynamic = "force-dynamic";
export default async function Admin({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const { range,days,page } = dashboardFilters(params);
  const options = dashboardViewOptions(params);
  const client = await createClient();
  const { data,error } = await client.rpc("admin_dashboard", { p_days:days,p_page:page });
  if (!error && data && page > Math.max(1,Math.ceil(data.style_image_count/12))) {
    redirect(dashboardHref(range,Math.max(1,Math.ceil(data.style_image_count/12)),options.view,options.detail,options.limit));
  }
  return <>
    <p className="helper muted">Statistics cover the active dataset. Deleted-post vote history is available under Ratings.</p>
    {error || !data ? <section role="alert"><h2>Statistics unavailable</h2><p>We couldn&apos;t load the dashboard. Your access may have changed, or the database may be temporarily unavailable.</p><a className="button" href="/admin">Try again</a></section>
      : <DashboardView data={data} range={range} page={page} {...options} />}
  </>;
}
