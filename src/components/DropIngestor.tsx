import { UploadCloud } from 'lucide-react';
import { parseFileToMeshNode } from '../lib/morphEngine';
import type { MeshNode } from '../lib/types';

export function DropIngestor({ onNodes }: { onNodes: (nodes: MeshNode[]) => void }) {
  async function handle(files: FileList | null, origin?: { x: number; y: number }) {
    if (!files?.length) return;
    const nodes = await Promise.all(Array.from(files).map((file, index) => parseFileToMeshNode(file, { x: (origin?.x ?? 240) + index * 34, y: (origin?.y ?? 200) + index * 34 })));
    onNodes(nodes);
  }
  return <label className="drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void handle(e.dataTransfer.files, { x: e.clientX - 130, y: e.clientY - 80 }); }}>
    <input type="file" multiple onChange={(e) => void handle(e.target.files)} hidden />
    <UploadCloud size={24} /><span>Drop any file. It becomes a morph node.</span><small>Text/code parsed locally · binaries routed + ready for backend storage</small>
  </label>;
}
