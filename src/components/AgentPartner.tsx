import { Send, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { askPartner } from '../lib/morphEngine';
import { appendMessage } from '../lib/persistence';
import type { AgentMessage, MeshNode } from '../lib/types';

export function AgentPartner({ selectedNode, onIntent }: { selectedNode?: MeshNode; onIntent: (text: string) => void }) {
  const [messages, setMessages] = useState<AgentMessage[]>([{ id: 'hello', role: 'agent', content: 'I am your front-end OSA partner: route, remember, package, and connect. Backend optional; ambition not optional.', createdAt: new Date().toISOString() }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    const prompt = input.trim(); if (!prompt) return;
    const user: AgentMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString(), nodeId: selectedNode?.id };
    setMessages(m => [...m, user]); appendMessage(user); setInput(''); setBusy(true);
    try { const result = await askPartner(prompt, selectedNode); const reply: AgentMessage = { id: crypto.randomUUID(), role: 'agent', content: result.generated || JSON.stringify(result), createdAt: new Date().toISOString(), nodeId: selectedNode?.id }; setMessages(m => [...m, reply]); appendMessage(reply); }
    catch (e) { const reply: AgentMessage = { id: crypto.randomUUID(), role: 'agent', content: 'Local fallback engaged. I can still create intent nodes, route departments, and prep backend calls. Remote brain is just not plugged in yet.', createdAt: new Date().toISOString() }; setMessages(m => [...m, reply]); }
    finally { setBusy(false); }
  }
  return <aside className="agent-panel"><header><div><Wand2 size={18}/><strong>Business Partner</strong></div><span>{busy ? 'morphing' : 'online'}</span></header><div className="agent-messages">{messages.map(m => <div key={m.id} className={`agent-msg ${m.role}`}>{m.content}</div>)}</div><div className="quick-actions"><button onClick={() => onIntent('Build a client site section from the selected mesh context')}>make site section</button><button onClick={() => onIntent('Route current mesh into departments and next actions')}>route mesh</button></div><div className="agent-input"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && void submit()} placeholder="Tell it what to morph into..."/><button onClick={() => void submit()} disabled={busy}><Send size={16}/></button></div></aside>;
}
