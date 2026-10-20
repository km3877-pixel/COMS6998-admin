export function dashboardFilters(params) {
  const range = ["7", "30", "all"].includes(params.range) ? params.range : "30";
  const page = typeof params.page === "string" && /^[1-9]\d{0,5}$/.test(params.page)
    ? Math.min(100000, Number(params.page)) : 1;
  return { range, days: range === "all" ? 0 : Number(range), page };
}

export function approval(style) {
  return Number(style.votes) > 0
    ? `${Math.round(Number(style.upvotes) / Number(style.votes) * 100)}%`
    : "No votes yet";
}

export function dashboardViewOptions(params) {
  return {
    view: ["overview","activity","posts","styles"].includes(params.view) ? params.view : "overview",
    detail: params.detail === "images" ? "images" : "overall",
    limit: params.limit === "5" ? 5 : 10,
  };
}

export function dashboardHref(range, page = 1, view = "overview", detail = "overall", limit = 10) {
  return `/admin?range=${encodeURIComponent(range)}&page=${page}&view=${view}&detail=${detail}&limit=${limit}`;
}
