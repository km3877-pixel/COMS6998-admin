export default function ActivityChart({ rows }) {
  const max = Math.max(1, ...rows.flatMap(r => [Number(r.posts), Number(r.vote_actions)]));
  const width = 900, height = 210, padding = 28;
  const point = (row, index, key) => {
    const x = rows.length === 1 ? width / 2 : padding + index / (rows.length - 1) * (width - 2 * padding);
    const y = height - padding - Number(row[key]) / max * (height - 2 * padding);
    return `${x},${y}`;
  };
  return <>
    <div className="chart-legend"><span><i className="posts-key" />Posts created</span><span><i className="votes-key" />Vote actions</span></div>
    <svg className="activity-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Daily posts and vote actions from ${rows[0]?.day} to ${rows.at(-1)?.day}. Exact values in the daily data table below.`}>
      <line x1={padding} x2={width-padding} y1={height-padding} y2={height-padding} stroke="#b5c7d5" />
      <line x1={padding} x2={width-padding} y1={padding} y2={padding} stroke="#e3e9ee" />
      <text x="0" y={padding+4} fontSize="12" fill="#596b7a">{max}</text>
      <text x="8" y={height-padding} fontSize="12" fill="#596b7a">0</text>
      {["posts", "vote_actions"].map((key, series) => <g key={key}>
        <polyline fill="none" stroke={series ? "#357c64" : "#32658b"} strokeWidth="2.5" points={rows.map((r,i)=>point(r,i,key)).join(" ")} />
        {rows.map((r,i)=>{ const [cx,cy] = point(r,i,key).split(","); return <circle key={r.day} cx={cx} cy={cy} r={rows.length>90?1.5:3} fill={series ? "#357c64" : "#32658b"}><title>{`${r.day}: ${r[key]} ${series ? "vote actions" : "posts"}`}</title></circle>; })}
      </g>)}
    </svg>
    <div className="chart-dates"><span>{rows[0]?.day}</span><span>{rows.at(-1)?.day}</span></div>
    <details className="daily-details"><summary>View daily counts</summary><div className="table-container daily-table"><table>
      <thead><tr><th scope="col">Date (UTC)</th><th scope="col">Posts</th><th scope="col">Vote actions</th><th scope="col">Vote removals</th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.day}><th scope="row">{r.day}</th><td>{r.posts}</td><td>{r.vote_actions}</td><td>{r.vote_removals}</td></tr>)}</tbody>
    </table></div></details>
  </>;
}
