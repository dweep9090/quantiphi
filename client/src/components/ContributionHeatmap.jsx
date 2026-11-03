export default function ContributionHeatmap({ data, loading }) {
  if (loading) return <section className="panel p-5"><h2 className="section-title">Contribution rhythm</h2><div className="skeleton mt-5 h-32" /></section>;
  if (!data?.available) return <section className="panel p-5"><h2 className="section-title">Contribution rhythm</h2><p className="empty-note mt-4">{data?.reason || 'Contribution history is not available.'} Add a GitHub token on the server to enable the contribution calendar.</p></section>;
  const days = data.days || [];
  const firstOffset = days.length ? (new Date(`${days[0].date}T00:00:00`).getDay() + 6) % 7 : 0;
  const cells = [...Array(firstOffset).fill(null), ...days];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const monthLabels = weeks.map((week, index) => {
    const firstOfMonth = week.find((day) => day && new Date(`${day.date}T00:00:00`).getDate() === 1);
    return firstOfMonth ? <span key={index}>{new Date(`${firstOfMonth.date}T00:00:00`).toLocaleString('en', { month: 'short' })}</span> : <span key={index} />;
  });
  return <section className="panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="section-title">Contribution rhythm</h2><p className="section-subtitle">{data.total || 0} contributions in the last year</p></div><div className="flex gap-5 text-xs text-slate-400"><span><b className="text-white">{data.stats?.currentStreak || 0}</b> day streak</span><span><b className="text-white">{data.stats?.longestStreak || 0}</b> best streak</span></div></div>
    <div className="heat-scroll mt-5"><div className="heat-months">{monthLabels}</div><div className="heat-grid">{weeks.map((week, wi)=><div className="heat-week" key={wi}>{week.map((day, di)=>day ? <div key={day.date} className={`heat-cell level-${day.level}`} title={`${day.date}: ${day.count} contributions`} aria-label={`${day.date}: ${day.count} contributions`} /> : <div className="heat-cell heat-empty" key={`empty-${wi}-${di}`} />)}</div>)}</div></div>
    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500"><span>{data.stats?.activeDays || 0} active days</span><span className="flex items-center gap-1.5">Less {Array.from({ length: 5 }, (_, i)=><i key={i} className={`heat-cell level-${i}`} />)} More</span></div>
  </section>;
}
