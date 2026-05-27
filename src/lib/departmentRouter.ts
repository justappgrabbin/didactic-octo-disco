import type { DepartmentSlug, MorphKind } from './types';

const rules: Array<{ slug: DepartmentSlug; terms: string[] }> = [
  { slug: 'finance', terms: ['invoice','payment','receipt','budget','tax','stripe','revenue','price','payroll'] },
  { slug: 'legal', terms: ['contract','nda','terms','policy','legal','compliance','privacy'] },
  { slug: 'engineering', terms: ['api','code','server','database','react','supabase','mcp','typescript','javascript','python','schema','edge'] },
  { slug: 'creative', terms: ['brand','design','logo','visual','copy','campaign','content','image','video','audio'] },
  { slug: 'operations', terms: ['workflow','process','schedule','task','system','admin','ops','runbook'] },
  { slug: 'strategy', terms: ['plan','roadmap','market','launch','offer','growth','business','partner'] },
  { slug: 'research', terms: ['research','paper','notes','analysis','dataset','study','rag'] },
  { slug: 'consciousness', terms: ['consciousness','resonance','morph','mrnn','neural','brain','virtual','substrate','agent'] },
  { slug: 'client', terms: ['client','customer','booking','department','site','page'] }
];

export function routeDepartment(input: { title: string; content?: string | null; type?: string; kind?: MorphKind }): DepartmentSlug {
  const haystack = `${input.title} ${input.content ?? ''} ${input.type ?? ''} ${input.kind ?? ''}`.toLowerCase();
  const scored = rules.map(rule => ({ slug: rule.slug, score: rule.terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0) })).sort((a,b) => b.score - a.score);
  return scored[0]?.score ? scored[0].slug : 'archive';
}
