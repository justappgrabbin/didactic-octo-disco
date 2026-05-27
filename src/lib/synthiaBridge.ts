import type { MeshNode } from './types';

export type SynthiaMessageType =
  | 'octo:ready'
  | 'file:ingested'
  | 'node:create'
  | 'node:morph'
  | 'node:update'
  | 'department:route'
  | 'consciousness:signal'
  | 'mcp:call'
  | 'backend:sync';

export interface SynthiaMessage<TPayload = unknown> {
  id: string;
  type: SynthiaMessageType;
  source: 'didactic-octo-disco';
  target: 'synthia-server';
  payload: TPayload;
  timestamp: string;
  trace: string[];
}

type Listener = (message: SynthiaMessage) => void;

const listeners = new Set<Listener>();
const outboxKey = 'synthia:didactic-octo-disco:outbox';

function readOutbox(): SynthiaMessage[] {
  try {
    return JSON.parse(localStorage.getItem(outboxKey) || '[]') as SynthiaMessage[];
  } catch {
    return [];
  }
}

function writeOutbox(messages: SynthiaMessage[]) {
  localStorage.setItem(outboxKey, JSON.stringify(messages.slice(-500)));
}

export function subscribeSynthiaBridge(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitToSynthia<TPayload>(type: SynthiaMessageType, payload: TPayload) {
  const message: SynthiaMessage<TPayload> = {
    id: crypto.randomUUID(),
    type,
    source: 'didactic-octo-disco',
    target: 'synthia-server',
    payload,
    timestamp: new Date().toISOString(),
    trace: ['didactic-octo-disco'],
  };

  writeOutbox([...readOutbox(), message]);
  listeners.forEach(listener => listener(message));

  window.dispatchEvent(new CustomEvent('synthia:morph-message', { detail: message }));
  return message;
}

export function announceOctoReady() {
  return emitToSynthia('octo:ready', {
    repo: 'justappgrabbin/didactic-octo-disco',
    architecture: 'message-passing',
    iframe: false,
    browserIframeOnly: true,
  });
}

export function emitNodesIngested(nodes: MeshNode[]) {
  return nodes.map(node => emitToSynthia('file:ingested', {
    nodeId: node.id,
    title: node.title,
    kind: node.kind,
    mime: node.mime,
    size: node.size,
    department: node.department,
    departmentSlug: node.departmentSlug,
    metadata: node.metadata,
  }));
}

export function emitNodeUpdated(node: MeshNode) {
  return emitToSynthia('node:update', {
    nodeId: node.id,
    title: node.title,
    state: node.state,
    x: node.x,
    y: node.y,
    department: node.department,
    departmentSlug: node.departmentSlug,
    updatedAt: node.updatedAt,
  });
}

export function emitNodeMorph(nodeId: string, mode: string) {
  return emitToSynthia('node:morph', {
    nodeId,
    mode,
  });
}

export function emitIntentToSynthia(text: string) {
  return emitToSynthia('consciousness:signal', {
    kind: 'partner-intent',
    text,
    intensity: Math.min(1, Math.max(0.1, text.length / 400)),
  });
}

export function getSynthiaBridgeOutbox() {
  return readOutbox();
}
