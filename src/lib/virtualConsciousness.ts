import type { MeshNode } from './types';

export function synthesizeConsciousness(nodes: MeshNode[]) {
  const total = nodes.length;
  const departments = new Set(nodes.map(n => n.departmentSlug)).size;
  const textMass = nodes.reduce((a,n) => a + (n.content?.length ?? 0), 0);
  const entropy = total ? Math.min(1, departments / Math.max(1, total)) : 0;
  const intensity = Math.min(1, Math.log10(textMass + 10) / 6);
  const phase = total === 0 ? 'dormant' : total < 4 ? 'observant' : total < 10 ? 'active' : intensity > 0.55 ? 'resonant' : 'growing';
  return { phase, entropy, intensity, departments, total, cadence: Math.round((total + departments) * 1.618) };
}
