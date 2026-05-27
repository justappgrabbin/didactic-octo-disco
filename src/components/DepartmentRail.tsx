import type { MeshNode } from '../lib/types';
const deps = ['strategy','creative','engineering','operations','finance','legal','research','consciousness','client','archive'];
export function DepartmentRail({ nodes, active, onActive }: { nodes: MeshNode[]; active: string; onActive: (slug: string) => void }) {
  return <nav className="department-rail"><button className={active === 'all' ? 'active' : ''} onClick={() => onActive('all')}>all <b>{nodes.length}</b></button>{deps.map(dep => <button key={dep} className={active === dep ? 'active' : ''} onClick={() => onActive(dep)}>{dep}<b>{nodes.filter(n => n.departmentSlug === dep).length}</b></button>)}</nav>;
}
