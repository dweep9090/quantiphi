export default function ProfileHeader({ profile, compatibility, fetchedAt, stale, onRefresh, refreshing }) {
  const age = fetchedAt ? Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 60000)) : 0;
  const scoreColor = !compatibility ? '#55e6c1' : compatibility.score >= 75 ? '#55e6c1' : compatibility.score >= 45 ? '#fbbf24' : '#fb7185';
  return <section className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
    <img className="h-20 w-20 rounded-2xl border border-white/10 object-cover" src={profile.avatarUrl} alt={`${profile.login} avatar`} />
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-white">{profile.name || profile.login}</h1><a className="text-sm text-accent hover:underline" href={profile.htmlUrl} target="_blank" rel="noreferrer">@{profile.login} ↗</a></div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{profile.bio || 'This developer has not added a bio yet.'}</p><p className="mt-3 text-xs text-slate-500">{[profile.location, profile.company].filter(Boolean).join(' · ') || 'GitHub developer'} · Synced {age < 1 ? 'just now' : `${age} min ago`}{stale ? ' · Showing stale data' : ''}</p>
    </div>
    <div className="flex items-center gap-3"><div className="match-badge" style={{ borderColor: `${scoreColor}55`, background: `${scoreColor}0d` }}><strong style={{ color: scoreColor }}>{compatibility ? `${compatibility.score}%` : '—'}</strong><span>MATCH</span></div><button className="button-secondary" onClick={onRefresh} disabled={refreshing}>{refreshing ? 'Syncing…' : '↻ Refresh'}</button></div>
  </section>;
}
