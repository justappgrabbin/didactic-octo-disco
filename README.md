# Synthia OSA Morph Engine

Production starter for the morphing front-end/orchestrator: drag any file, turn it into mesh nodes, route to departments, chat with the partner panel, persist locally by default, and sync to Supabase/MCP when configured.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Connect later

- Supabase: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then run `supabase/schema.sql`.
- MCP/Trident: run the Python bridge in `server/mcp/trident_mcp_server.py` and set `VITE_MCP_HTTP_URL` or `VITE_TRIDENT_HTTP_URL`.
- Virtual consciousness engine: preserved under `server/virtual_consciousness/qhd`.
- Legacy source systems are preserved under `legacy/`.

## Current front-end capabilities

- Morphing substrate UI
- Any-file ingestion with local parsing for text/code/json and binary routing metadata for everything else
- Department router
- Mesh edges/message passing by department
- Local-first persistence
- Supabase-ready schema
- MCP-ready HTTP bridge adapter
- Partner chat panel with local fallback
