import { useEffect, useState } from 'react';
import { api, encoded } from '../api/client.js';
export default function CompatibilityPanel({ username, initialJob, hasLatest, onResult }) {
  const [job, setJob] = useState(initialJob || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(null);
  useEffect(() => {
    if (hasLatest) api(`/compatibility/${encoded(username)}/latest`).then(setResult).catch((err) => setError(err.message));
  }, [hasLatest, username]);
  async function analyze(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { const data = await api(`/compatibility/${encoded(username)}`, { method: 'POST', body: JSON.stringify({ jobDescription: job }) }); setResult(data); onResult(data); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function coach() {
    setBusy(true); setError('');
    try { const data = await api(`/coach/${encoded(username)}`, { method: 'POST', body: JSON.stringify({ analysisId: result?.analysisId }) }); setPlan(data); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">CAREER FIT</p><h2 className="section-title mt-2">Match your stack to a role</h2><p className="section-subtitle">A transparent skill comparison based on your public repositories.</p></div>{result && <div className="score-pill">{result.score}% <small>match</small></div>}</div>
    <form className="mt-5" onSubmit={analyze}><label htmlFor="job-description" className="sr-only">Job description</label><textarea id="job-description" className="textarea-control min-h-32" minLength="50" maxLength="10000" placeholder="Paste a job description (50–10,000 characters)…" value={job} onChange={(event)=>setJob(event.target.value)} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{job.length} / 10,000</span><button className="button-primary" disabled={busy || job.trim().length < 50}>{busy ? 'Working…' : 'Analyze compatibility'}</button></div></form>
    {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
    {result && <><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">Matched skills</p><div className="flex flex-wrap gap-2">{result.matched.map((skill)=><span className="skill-chip matched" key={skill}>{skill}</span>)}{!result.matched.length && <span className="text-sm text-slate-500">No matches found yet.</span>}</div></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-300">Skills to build</p><div className="flex flex-wrap gap-2">{result.missing.map((skill)=><span className="skill-chip missing" key={skill}>{skill}</span>)}{!result.missing.length && <span className="text-sm text-slate-500">No missing skills found.</span>}</div></div></div><button className="button-secondary mt-5" disabled={busy} onClick={coach}>Get my improvement plan ↗</button></>}
    {plan && <div className="mt-5 space-y-4 border-t border-white/5 pt-5"><h3 className="font-semibold text-white">Your next steps</h3>{plan.message && <p className="text-sm text-accent">{plan.message}</p>}{plan.roadmap?.map((item)=><div className="rounded-xl bg-white/[0.03] p-4" key={item.skill}><div className="flex justify-between gap-3 font-medium text-white"><span>{item.skill}</span><span className="text-xs text-slate-500">{item.estimatedTime}</span></div><ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-400">{item.steps.map((step)=><li key={step}>{step}</li>)}</ol></div>)}{plan.projectIdeas?.map((idea)=><div className="rounded-xl border border-white/5 p-4" key={idea.title}><p className="font-medium text-white">{idea.title}</p><p className="mt-1 text-sm text-slate-400">{idea.description}</p></div>)}{plan.resumeBullets?.map((entry)=><div className="text-sm text-slate-400" key={entry.repo}><p className="font-medium text-white">{entry.repo} resume ideas</p>{entry.bullets.map((bullet)=><p className="mt-1" key={bullet}>• {bullet}</p>)}</div>)}</div>}
  </section>;
}
