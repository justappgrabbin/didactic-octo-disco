import { motion } from 'framer-motion';
import { Brain, BriefcaseBusiness, Code2, FileArchive, FileText, Image, Sparkles } from 'lucide-react';
import type { MeshNode } from '../lib/types';

const kindIcon: Record<string, JSX.Element> = { image: <Image size={15}/>, code: <Code2 size={15}/>, text: <FileText size={15}/>, json: <Code2 size={15}/>, archive: <FileArchive size={15}/>, intent: <Brain size={15}/> };

export function MeshSurface({ nodes, selectedId, onSelect, onMove }: { nodes: MeshNode[]; selectedId?: string | null; onSelect: (id: string) => void; onMove: (id: string, x: number, y: number) => void }) {
  return <section className="mesh-surface">
    <svg className="mesh-edges" aria-hidden>{nodes.flatMap(node => node.edges.map(edgeId => { const to = nodes.find(n => n.id === edgeId); if (!to) return null; return <line key={`${node.id}-${edgeId}`} x1={node.x + 135} y1={node.y + 48} x2={to.x + 135} y2={to.y + 48}/>; }))}</svg>
    {nodes.map(node => <motion.button key={node.id} className={`mesh-node ${selectedId === node.id ? 'selected' : ''} ${node.departmentSlug}`} drag dragMomentum={false} style={{ left: node.x, top: node.y }} onDragEnd={(_, info) => onMove(node.id, node.x + info.offset.x, node.y + info.offset.y)} onClick={() => onSelect(node.id)} whileHover={{ scale: 1.025 }}>
      <div className="mesh-node-top"><span className="node-orb">{kindIcon[node.kind] ?? <Sparkles size={15}/>}</span><span className="node-state">{node.state}</span></div>
      <strong>{node.title}</strong><small>{node.departmentSlug} · {node.kind}</small>
      {node.kind === 'image' && typeof node.metadata.objectUrl === 'string' ? <img src={node.metadata.objectUrl} alt="preview"/> : <p>{node.summary}</p>}
    </motion.button>)}
    {nodes.length === 0 && <div className="empty-mesh"><Brain/><h2>Morph substrate waiting.</h2><p>Feed it files, prompts, plans, code, assets, receipts, chaos. It will sort itself because apparently folders had one job.</p></div>}
  </section>;
}
