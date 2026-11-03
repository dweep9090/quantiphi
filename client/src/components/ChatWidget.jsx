import { useEffect, useRef, useState } from 'react';
import { api, encoded } from '../api/client.js';

const suggestions = ['Which repo has the most stars?', 'What is my strongest language?', 'Summarize my profile for a recruiter', 'How consistent have I been?'];
export default function ChatWidget({ username }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  useEffect(() => { api(`/chat/${encoded(username)}/history`).then((data) => setMessages(data.messages || [])).catch(() => setError('Chat history is temporarily unavailable.')); }, [username]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);
  async function send(value = text) {
    const message = value.trim();
    if (!message || busy) return;
    setText(''); setError(''); setMessages((items) => [...items, { role: 'user', content: message }]); setBusy(true);
    try { const data = await api(`/chat/${encoded(username)}`, { method: 'POST', body: JSON.stringify({ message }) }); setMessages((items) => [...items, { role: 'assistant', content: data.reply }]); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="chat-anchor"><button className="chat-launcher" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label={open ? 'Close assistant' : 'Open GitHub assistant'}>{open ? '×' : '✦'}<span>{open ? '' : ' Ask my GitHub'}</span></button>
    {open && <section className="chat-panel"><header className="flex items-center justify-between border-b border-white/5 p-4"><div><p className="font-semibold text-white">Ask my GitHub</p><p className="mt-1 text-xs text-slate-500">Answers grounded in your profile</p></div><button className="text-slate-500" onClick={()=>setOpen(false)} aria-label="Close chat">×</button></header>
      <div className="chat-messages">{!messages.length && <div className="space-y-2">{suggestions.map((item)=><button key={item} className="suggestion" onClick={()=>send(item)}>{item} ↗</button>)}</div>}{messages.map((item,index)=><div className={`chat-message ${item.role === 'user' ? 'from-user' : ''}`} key={`${index}-${item.createdAt || ''}`}>{item.content}</div>)}{busy && <div className="chat-message">Thinking…</div>}<div ref={endRef} /></div>
      {error && <p className="px-4 text-xs text-rose-300">{error}</p>}<form className="chat-form" onSubmit={(event)=>{event.preventDefault();send();}}><input aria-label="Ask a question" value={text} onChange={(event)=>setText(event.target.value)} placeholder="Ask a question…" maxLength={1000} /><button disabled={!text.trim() || busy} aria-label="Send message">↑</button></form>
    </section>}
  </div>;
}
