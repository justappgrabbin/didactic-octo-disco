export type MorphState = 'seed' | 'parsed' | 'classified' | 'linked' | 'published' | 'error';
export type DepartmentSlug = 'strategy' | 'creative' | 'operations' | 'finance' | 'legal' | 'research' | 'engineering' | 'archive' | 'consciousness' | 'client';
export type MorphKind = 'text' | 'code' | 'json' | 'image' | 'audio' | 'video' | 'pdf' | 'archive' | 'document' | 'binary' | 'url' | 'intent';

export interface MeshNode {
  id: string;
  title: string;
  sourceType: string;
  kind: MorphKind;
  departmentSlug: string;
  content?: string | null;
  summary?: string | null;
  state: MorphState;
  x: number;
  y: number;
  z?: number;
  metadata: Record<string, unknown>;
  edges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  id: string;
  role: 'system' | 'user' | 'agent' | 'tool';
  content: string;
  nodeId?: string;
  createdAt: string;
}

export interface MorphEvent {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
}
