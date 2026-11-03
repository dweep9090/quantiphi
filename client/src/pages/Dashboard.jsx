import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, encoded } from '../api/client.js';
import ProfileHeader from '../components/ProfileHeader.jsx';
import LanguagePie from '../components/LanguagePie.jsx';
import ContributionHeatmap from '../components/ContributionHeatmap.jsx';
import RepoGrid from '../components/RepoGrid.jsx';
import CompatibilityPanel from '../components/CompatibilityPanel.jsx';
import ChatWidget from '../components/ChatWidget.jsx';

export default function Dashboard() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [allRepos, setAllRepos] = useState([]);
  const [contributions, setContributions] = useState(null);
  const [repoLoading, setRepoLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [repoError, setRepoError] = useState('');

  const loadProfile = useCallback(async () => {
    setProfileLoading(true); setError('');
    try {
      const data = await api(`/profile/${encoded(username)}`);
      setProfile(data);
    } catch (err) { setError(err.message); }
    finally { setProfileLoading(false); }
  }, [username]);

  const loadRepos = useCallback(async (sort = 'stars', language = '') => {
    setRepoLoading(true); setRepoError('');
    try {
      const params = new URLSearchParams({ sort });
      if (language) params.set('language', language);
      const data = await api(`/profile/${encoded(username)}/repos?${params}`);
      setRepos(data.repos || []);
      if (!language) setAllRepos(data.repos || []);
    } catch (err) { setRepoError(err.message); }
    finally { setRepoLoading(false); }
  }, [username]);

  useEffect(() => {
    loadProfile();
    loadRepos();
    api(`/profile/${encoded(username)}/contributions`).then(setContributions).catch(() => setContributions({ available: false, reason: 'Could not load contribution history.' }));
  }, [loadProfile, loadRepos, username]);

  async function refresh() {
    setRefreshing(true);
    try {
      const data = await api(`/profile/${encoded(username)}/refresh`, { method: 'POST' });
      setProfile(data);
      await Promise.all([loadRepos(), api(`/profile/${encoded(username)}/contributions`).then(setContributions)]);
    } catch (err) { setError(err.message); }
    finally { setRefreshing(false); }
  }
  function updateCompatibility(result) {
    setProfile((current) => ({ ...current, latestCompatibility: { score: result.score, createdAt: new Date().toISOString() } }));
  }

  if (profileLoading && !profile) return <main className="min-h-screen px-5 py-20"><div className="mx-auto max-w-6xl"><div className="skeleton h-32" /><div className="skeleton mt-5 h-64" /></div></main>;
  if (error && !profile) return <main className="flex min-h-screen items-center justify-center px-5"><div className="panel max-w-lg p-8 text-center"><div className="text-4xl">⌕</div><h1 className="mt-4 text-2xl font-bold text-white">{error.includes('could not be found') ? 'GitHub user not found' : 'Could not load this profile'}</h1><p className="mt-3 text-sm text-slate-400">{error}</p><Link className="button-primary mt-6 inline-flex" to="/">← Back to search</Link></div></main>;

  return <main className="min-h-screen px-4 pb-20 sm:px-6"><nav className="mx-auto flex max-w-7xl items-center justify-between py-6"><Link to="/" className="brand"><span className="brand-mark">D</span> devfolio</Link><span className="nav-note">Developer portfolio</span></nav>
    {error && <div className="mx-auto mb-4 max-w-7xl rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-200">{error}</div>}
    <div className="mx-auto max-w-7xl space-y-5">
      {profile && <ProfileHeader profile={profile.profile} compatibility={profile.latestCompatibility} fetchedAt={profile.fetchedAt} stale={profile.stale} onRefresh={refresh} refreshing={refreshing} />}
      {profile && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Followers', profile.profile.followers], ['Following', profile.profile.following], ['Total stars', profile.profile.totalStars], ['Public repositories', profile.profile.publicRepos]].map(([label, value], i)=><div className="panel stat-card" key={label}><span className="stat-icon">{['◎','↗','☆','▤'][i]}</span><p className="mt-4 text-2xl font-bold text-white">{Number(value || 0).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div>}
      {profile && <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><LanguagePie languages={profile.languages || []} /><ContributionHeatmap data={contributions} loading={!contributions} /></div>}
      {profile && <CompatibilityPanel key={username} username={username} initialJob={profile.settings?.jobDescription || ''} hasLatest={Boolean(profile.latestCompatibility)} onResult={updateCompatibility} />}
      {repoError && <p className="text-sm text-rose-300">{repoError}</p>}
      <RepoGrid repos={repos} allRepos={allRepos} onChange={loadRepos} loading={repoLoading} />
    </div><ChatWidget username={username} />
  </main>;
}
