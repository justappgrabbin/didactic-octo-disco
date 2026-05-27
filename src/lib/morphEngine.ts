import { routeDepartment } from './departmentRouter';
import type { MeshNode, MorphKind } from './types';

function id(prefix = 'node') {
  return crypto.randomUUID?.() ?? `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const textExtensions = /\.(md|txt|json|js|ts|tsx|jsx|css|html|xml|svg|py|sql|csv|yaml|yml|log|ini|env|toml|rs|go|java|c|cpp|h|php|rb|sh|zsh|ps1)$/i;

export function detectKind(file: File): MorphKind {
  const name = file.name.toLowerCase();
  const type = file.type || '';
  if (type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|avif|ico)$/i.test(name)) return 'image';
  if (type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg)$/i.test(name)) return 'audio';
  if (type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(name)) return 'video';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (/\.(zip|tar|gz|rar|7z)$/i.test(name)) return 'archive';
  if (name.endsWith('.json')) return 'json';
  if (/\.(js|ts|tsx|jsx|py|sql|css|html|rs|go|java|c|cpp)$/i.test(name)) return 'code';
  if (type.startsWith('text/') || textExtensions.test(name)) return 'text';
  if (/\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(name)) return 'document';
  return 'binary';
}

export async function parseFileToMeshNode(file: File, position = { x: 160, y: 160 }): Promise<MeshNode> {
  const kind = detectKind(file);
  let content: string | null = null;
  let sourceType = file.type || 'application/octet-stream';
  const metadata: Record<string, unknown> = { size: file.size, lastModified: file.lastModified, name: file.name };

  if (['text', 'code', 'json'].includes(kind)) {
    content = await file.text();
    if (kind === 'json') {
      try { content = JSON.stringify(JSON.parse(content), null, 2); sourceType = 'application/json'; }
      catch { metadata.jsonError = 'Invalid JSON, preserved raw text'; }
    }
  } else if (kind === 'image') {
    metadata.objectUrl = URL.createObjectURL(file);
    metadata.previewable = true;
  } else {
    metadata.previewable = false;
    metadata.storageHint = 'Send original file bytes to your backend/Supabase Storage when connected.';
  }

  const departmentSlug = routeDepartment({ title: file.name, content, type: sourceType, kind });
  const now = new Date().toISOString();
  const summary = summarize({ title: file.name, content, kind, sourceType, size: file.size });
  return {
    id: id(), title: file.name, sourceType, kind, departmentSlug, content, summary,
    state: 'classified', x: position.x, y: position.y, z: 0, metadata, edges: [], createdAt: now, updatedAt: now
  };
}

export function parseIntentToNode(raw: string, position = { x: 280, y: 220 }): MeshNode {
  const now = new Date().toISOString();
  const departmentSlug = routeDepartment({ title: raw, content: raw, type: 'intent', kind: 'intent' });
  return { id: id('intent'), title: raw.slice(0, 72), sourceType: 'intent/user', kind: 'intent', departmentSlug, content: raw, summary: raw, state: 'classified', x: position.x, y: position.y, z: 0, metadata: { source: 'composer' }, edges: [], createdAt: now, updatedAt: now };
}

function summarize(input: { title: string; content: string | null; kind: MorphKind; sourceType: string; size: number }) {
  if (input.content) return input.content.replace(/\s+/g, ' ').slice(0, 320);
  return `${input.kind.toUpperCase()} asset · ${input.sourceType || 'unknown'} · ${(input.size / 1024).toFixed(1)} KB · ready for backend storage and morph routing.`;
}

export function linkByDepartment(nodes: MeshNode[]) {
  return nodes.map((node) => ({ ...node, edges: nodes.filter(n => n.id !== node.id && n.departmentSlug === node.departmentSlug).slice(0, 3).map(n => n.id) }));
}

export async function askPartner(prompt: string, node?: MeshNode) {
  const base = import.meta.env.VITE_MCP_HTTP_URL || import.meta.env.VITE_TRIDENT_HTTP_URL;
  if (base) {
    const res = await fetch(`${base.replace(/\/$/, '')}/rag/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, rag_query: node?.content || prompt, max_tokens: 220, temperature: 0.7 }) });
    if (res.ok) return res.json();
  }
  return { generated: localPartner(prompt, node), head_used: 'local-fallback' };
}

function localPartner(prompt: string, node?: MeshNode) {
  const target = node ? `for ${node.title} in ${node.departmentSlug}` : 'for the active mesh';
  return `I routed this ${target}. Next move: classify, persist, connect adjacent nodes, then expose it to your backend adapter. Prompt received: “${prompt.slice(0, 180)}”.`;
}
