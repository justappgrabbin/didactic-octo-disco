export type MCPToolCall = { tool: string; args?: Record<string, unknown> };

export async function callMCP(call: MCPToolCall) {
  const base = import.meta.env.VITE_MCP_HTTP_URL;
  if (!base) return { ok: false, simulated: true, message: `MCP not configured. Would call ${call.tool}.`, call };
  const res = await fetch(`${base.replace(/\/$/, '')}/mcp/call`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(call) });
  if (!res.ok) throw new Error(`MCP bridge ${res.status}`);
  return res.json();
}
