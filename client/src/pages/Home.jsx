import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  function submit(event) {
    event.preventDefault();
    const login = username.trim();
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(login)) return setError('Enter a valid GitHub username.');
    navigate(`/u/${encodeURIComponent(login)}`);
  }
  return (
    <main className="hero min-h-screen px-5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between py-7"><a href="/" className="brand"><span className="brand-mark">D</span> devfolio</a><span className="nav-note">A clearer view of your GitHub story</span></nav>
      <section className="mx-auto grid max-w-6xl items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div><p className="eyebrow"><span className="pulse-dot" /> DEVELOPER PORTFOLIO ANALYTICS</p><h1 className="hero-title mt-6">Your work,<br /><span className="gradient-text">in full view.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Turn your public GitHub activity into a polished portfolio, discover your strongest skills, and see how you line up with your next role.</p>
          <form onSubmit={submit} className="search-box mt-9 flex max-w-xl flex-col gap-3 p-2 sm:flex-row"><div className="flex flex-1 items-center gap-3 px-3"><span className="text-xl text-slate-500">@</span><input aria-label="GitHub username" className="min-w-0 flex-1 bg-transparent py-3 text-white outline-none placeholder:text-slate-600" placeholder="Your GitHub username" value={username} onChange={(event) => { setUsername(event.target.value); setError(''); }} /></div><button className="button-primary" type="submit">Explore profile <span>↗</span></button></form>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}<p className="mt-4 text-xs text-slate-500">Public repositories · Contribution trends · Job match insights</p>
        </div>
        <div className="preview-card"><div className="flex items-center justify-between border-b border-white/5 px-6 py-5"><div><p className="text-sm font-semibold text-white">Developer overview</p><p className="mt-1 text-xs text-slate-500">A snapshot of your engineering profile</p></div><span className="status-pill">LIVE VIEW</span></div><div className="p-6"><div className="flex items-center gap-4"><div className="avatar-placeholder">GH</div><div><div className="font-semibold text-white">Your GitHub profile</div><div className="mt-1 text-sm text-slate-500">Projects, skills, momentum</div></div><span className="ml-auto score-mini">—%</span></div><div className="mt-7 grid grid-cols-3 gap-3">{[['01','Repositories'],['02','Languages'],['03','Insights']].map(([n,label])=><div className="metric-tile" key={label}><span>{n}</span><p>{label}</p></div>)}</div><div className="mt-5 rounded-xl border border-white/5 bg-white/[0.025] p-4"><div className="flex justify-between text-xs"><span className="text-slate-400">Compatibility snapshot</span><span className="text-slate-600">Awaiting profile</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-teal-400 to-blue-400 opacity-30" /></div></div></div></div>
      </section><footer className="mx-auto max-w-6xl border-t border-white/5 py-5 text-xs text-slate-600">Built for developers who want to make their work speak.</footer>
    </main>
  );
}
