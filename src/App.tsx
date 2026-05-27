import { useEffect, useMemo, useState } from 'react';
import { Activity, Database, Network, RadioTower, Save, Sparkles } from 'lucide-react';
import { AgentPartner } from './components/AgentPartner';
import { DepartmentRail } from './components/DepartmentRail';
import { DropIngestor } from './components/DropIngestor';
import { MeshSurface } from './components/MeshSurface';
import { linkByDepartment, parseIntentToNode } from './lib/morphEngine';
import { appendEvent, loadNodes, saveLocalNodes, saveNode } from './lib/persistence';
import { announceOctoReady, emitIntentToSynthia, emitNodeUpdated, emitNodesIngested } from './lib/synthiaBridge';
import { synthesizeConsciousness } from './lib/virtualConsciousness';
import type { MeshNode } from './lib/types';
import './styles/app.css';

export default function App() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [department, setDepartment] = useState('all');
  const [syncState, setSyncState] = useState('local');
  useEffect(() => { void loadNodes().then(setNodes); announceOctoReady(); }, []);
  const selectedNode = nodes.find(n => n.id === selectedId);
  const filtered = useMemo(() => department === 'all' ? nodes : nodes.filter(n => n.departmentSlug === department), [nodes, department]);
  const field = useMemo(() => synthesizeConsciousness(nodes), [nodes]);

  function ingest(incoming: MeshNode[]) {
    const linked = linkByDepartment([...incoming, ...nodes]);
    setNodes(linked); saveLocalNodes(linked); incoming.forEach(n => { void saveNode(n).catch(() => setSyncState('local')); appendEvent({ id: crypto.randomUUID(), type: 'node.ingested', payload: n, createdAt: new Date().toISOString() }); });
    emitNodesIngested(incoming);
    setSelectedId(incoming[0]?.id ?? selectedId);
  }
  function move(id: string, x: number, y: number) {
    setNodes(prev => { const next = prev.map(n => n.id === id ? { ...n, x, y, updatedAt: new Date().toISOString() } : n); saveLocalNodes(next); const node = next.find(n => n.id === id); if (node) { void saveNode(node).catch(() => setSyncState('local')); emitNodeUpdated(node); } return next; });
  }
  function addIntent(text: string) { emitIntentToSynthia(text); ingest([parseIntentToNode(text, { x: 320 + Math.random() * 120, y: 180 + Math.random() * 80 })]); }
  async function saveAll() { setSyncState('syncing'); try { for (const node of nodes) await saveNode(node); setSyncState('synced'); } catch { setSyncState('local'); } }

  return <div className={`app-shell phase-${field.phase}`}><header className="topbar"><div><span className="brand-orb"><Sparkles size={18}/></span><div><h1>Synthia OSA Morph Engine</h1><p>front end · orchestrator · partner · substrate</p></div></div><section className="metrics"><span><Activity size={14}/> {field.phase}</span><span><Network size={14}/> {nodes.length} nodes</span><span><RadioTower size={14}/> {field.cadence} cadence</span><span><Database size={14}/> {syncState}</span><button onClick={() => void saveAll()}><Save size={14}/> save</button></section></header><main><DepartmentRail nodes={nodes} active={department} onActive={setDepartment}/><section className="workbench"><DropIngestor onNodes={ingest}/><MeshSurface nodes={filtered} selectedId={selectedId} onSelect={setSelectedId} onMove={move}/></section><AgentPartner selectedNode={selectedNode} onIntent={addIntent}/></main><footer className="statusline"><span>entropy {field.entropy.toFixed(2)}</span><span>intensity {field.intensity.toFixed(2)}</span><span>departments {field.departments}</span><span>{selectedNode ? `selected: ${selectedNode.title}` : 'no node selected'}</span></footer></div>;
}
