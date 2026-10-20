export const styles = {dry_self_deprecating:"Dry / self-deprecating",internet_voice:"Internet voice",college_twist:"College twist"};
export const isUuid = value => typeof value==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function listFilters(params={}) {
  return {search: typeof params.q==="string" ? params.q.trim().slice(0,100) : "",
    page: /^\d+$/.test(params.page ?? "") ? Math.min(100000,Math.max(1,Number(params.page))) : 1};
}
export function dateTime(value) { return value ? new Date(value).toLocaleString("en-US",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})+" UTC" : "—"; }
export function safeChoice(value,choices,fallback) { return choices.includes(value) ? value : fallback; }
