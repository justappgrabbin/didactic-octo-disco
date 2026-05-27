import { supabase } from './supabase';
import type { MeshNode, AgentMessage, MorphEvent } from './types';

const KEY = 'synthia:osa:morph:v1';
const MSG_KEY = 'synthia:osa:messages:v1';
const EVT_KEY = 'synthia:osa:events:v1';

export async function saveNode(node: MeshNode) {
  saveLocalNode(node);
  if (!supabase) return { local: true, node };

  const { data: department, error: deptError } = await supabase.from('departments').upsert({ name: titleCase(node.departmentSlug), slug: node.departmentSlug }, { onConflict: 'slug' }).select('id').single();
  if (deptError) throw deptError;
  const { data, error } = await supabase.from('mesh_nodes').upsert({ id: node.id, department_id: department.id, title: node.title, source_type: node.sourceType, kind: node.kind, content: node.content, summary: node.summary, state: node.state, position: { x: node.x, y: node.y, z: node.z ?? 0 }, metadata: node.metadata, edges: node.edges, updated_at: new Date().toISOString() }).select('*').single();
  if (error) throw error;
  return data;
}

export function saveLocalNode(node: MeshNode) {
  const nodes = loadLocalNodes().filter(n => n.id !== node.id);
  nodes.unshift({ ...node, updatedAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(nodes.slice(0, 300)));
}

export function saveLocalNodes(nodes: MeshNode[]) { localStorage.setItem(KEY, JSON.stringify(nodes.slice(0, 300))); }
export function loadLocalNodes(): MeshNode[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }

export async function loadNodes(): Promise<MeshNode[]> {
  if (!supabase) return loadLocalNodes();
  const { data, error } = await supabase.from('mesh_nodes').select('*, departments(slug)').order('updated_at', { ascending: false }).limit(120);
  if (error) return loadLocalNodes();
  return (data ?? []).map((row: any) => ({ id: row.id, title: row.title, sourceType: row.source_type, kind: row.kind ?? 'binary', departmentSlug: row.departments?.slug ?? 'archive', content: row.content, summary: row.summary, state: row.state, x: row.position?.x ?? 160, y: row.position?.y ?? 160, z: row.position?.z ?? 0, metadata: row.metadata ?? {}, edges: row.edges ?? [], createdAt: row.created_at, updatedAt: row.updated_at }));
}

export function appendMessage(message: AgentMessage) { const m = loadMessages(); m.push(message); localStorage.setItem(MSG_KEY, JSON.stringify(m.slice(-200))); }
export function loadMessages(): AgentMessage[] { try { return JSON.parse(localStorage.getItem(MSG_KEY) || '[]'); } catch { return []; } }
export function appendEvent(event: MorphEvent) { const e = loadEvents(); e.push(event); localStorage.setItem(EVT_KEY, JSON.stringify(e.slice(-300))); }
export function loadEvents(): MorphEvent[] { try { return JSON.parse(localStorage.getItem(EVT_KEY) || '[]'); } catch { return []; } }

function titleCase(slug: string) { return slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '); }
