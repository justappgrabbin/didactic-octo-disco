"""
TRIDENT MCP Server — FastMCP
Exposes TRIDENT's 3 heads + RAG as MCP tools.
Claude (or any MCP client) can call:
  - trident_generate   → run the model
  - trident_add_chunk  → add knowledge to RAG store
  - trident_search_rag → query the RAG store directly
  - trident_router     → ask which head would handle a query
"""

import json, asyncio
from typing import Optional

# Optional HTTP endpoint support for app/browser RAG calls.
# MCP stdio remains the default entrypoint when this file is run normally.
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
except Exception:  # FastAPI is optional until HTTP mode is used.
    FastAPI = None
    CORSMiddleware = None
    BaseModel = object
from mcp.server.fastmcp import FastMCP

# ── lazy imports so server starts even without torch ──
_model = None
_store = None

def get_model():
    global _model
    if _model is None:
        from model import Trident, TridentConfig
        import torch
        cfg    = TridentConfig()
        _model = Trident(cfg)
        # Try to load checkpoint
        import os
        if os.path.exists('trident.pt'):
            _model.load_state_dict(torch.load('trident.pt', map_location='cpu'))
            print("[MCP] Loaded trident.pt")
        _model.eval()
    return _model

def get_store():
    global _store
    if _store is None:
        from rag import ChunkStore
        _store = ChunkStore()
        # Try to load persisted chunks
        import os
        if os.path.exists('chunks.json'):
            with open('chunks.json') as f:
                _store.import_json(f.read())
            print(f"[MCP] Loaded {len(_store.chunks)} chunks")
    return _store

def save_store():
    store = get_store()
    with open('chunks.json', 'w') as f:
        f.write(store.export_json())


# ── simple tokenizer shim (replace with real BPE) ──
def tokenize(text: str, vocab_size=4096) -> list:
    return [ord(c) % vocab_size for c in text[:128]]

def detokenize(ids: list) -> str:
    return ''.join(chr(max(32, min(126, i % 95 + 32))) for i in ids)


# ── MCP Server ──
mcp = FastMCP(
    name="trident",
    version="1.0.0",
    description="TRIDENT 3-head LM with P2P RAG. Heads: code | math | research."
)


@mcp.tool(
    description="Generate text using TRIDENT. Specify head='code'|'math'|'research' or leave blank for auto-routing. Optionally provide a RAG query to retrieve context first."
)
def trident_generate(
    prompt: str,
    head: Optional[str] = None,
    max_tokens: int = 64,
    temperature: float = 0.8,
    rag_query: Optional[str] = None
) -> dict:
    """Run the 3-head LM with optional RAG context retrieval."""
    import torch

    if head and head not in ['code', 'math', 'research']:
        return {"error": f"Invalid head '{head}'. Use: code | math | research"}

    model = get_model()
    store = get_store()

    # RAG retrieval
    rag_chunks_tensor = None
    retrieved = []
    if rag_query:
        q_emb = store.embed_fn(rag_query)
        hits  = store.search(q_emb, top_k=3, head_tag=head)
        if hits:
            import torch
            rag_chunks_tensor = torch.tensor(
                [[c.embedding for c in hits]], dtype=torch.float32
            )  # [1, K, 128]
            retrieved = [c.text for c in hits]

    # Tokenize
    ids = torch.tensor([tokenize(prompt)], dtype=torch.long)

    # Generate
    with torch.no_grad():
        out, router_w = model(ids, rag=rag_chunks_tensor, head=head, return_router=True)
        gen_ids = model.generate(ids, max_new=max_tokens, temp=temperature,
                                  rag=rag_chunks_tensor, head=head)

    prompt_len   = ids.shape[1]
    new_tokens   = gen_ids[0, prompt_len:].tolist()
    generated    = detokenize(new_tokens)
    router_dict  = {n: float(f"{v:.3f}") for n, v in zip(model.cfg.heads, router_w[0].tolist())}

    return {
        "generated":    generated,
        "head_used":    head or f"ensemble {router_dict}",
        "router_weights": router_dict,
        "rag_retrieved": retrieved,
        "tokens_generated": len(new_tokens)
    }


@mcp.tool(
    description="Add a text chunk to the RAG knowledge base. Tag with head='code'|'math'|'research'|'any'."
)
def trident_add_chunk(
    text: str,
    source: str = "mcp",
    head_tag: str = "any"
) -> dict:
    """Add knowledge to the shared RAG store."""
    store = get_store()
    chunk = store.add(text, source=source, head_tag=head_tag)
    save_store()
    return {
        "id":       chunk.id,
        "head_tag": chunk.head_tag,
        "source":   chunk.source,
        "total_chunks": len(store.chunks)
    }


@mcp.tool(
    description="Search the RAG knowledge base directly. Returns top matching chunks."
)
def trident_search_rag(
    query: str,
    top_k: int = 3,
    head_tag: Optional[str] = None
) -> dict:
    """Semantic search over the local RAG chunk store."""
    store = get_store()
    q_emb = store.embed_fn(query)
    hits  = store.search(q_emb, top_k=top_k, head_tag=head_tag)
    return {
        "query":   query,
        "results": [{"id": c.id, "text": c.text[:200], "source": c.source, "head_tag": c.head_tag} for c in hits],
        "total_chunks_in_store": len(store.chunks)
    }


@mcp.tool(
    description="Ask TRIDENT's router which head would handle a given query (without generating)."
)
def trident_router(query: str) -> dict:
    """Predict which specialist head best matches a query."""
    import torch
    model = get_model()
    ids   = torch.tensor([tokenize(query)], dtype=torch.long)
    with torch.no_grad():
        _, rw = model(ids, return_router=True)
    weights = {n: float(f"{v:.3f}") for n, v in zip(model.cfg.heads, rw[0].tolist())}
    best    = max(weights, key=weights.get)
    return {"query": query, "router_weights": weights, "recommended_head": best}


@mcp.tool(
    description="List all chunks in the RAG store with metadata."
)
def trident_list_chunks(head_tag: Optional[str] = None) -> dict:
    """List RAG knowledge base chunks."""
    store  = get_store()
    chunks = list(store.chunks.values())
    if head_tag:
        chunks = [c for c in chunks if c.head_tag in ('any', head_tag)]
    return {
        "total": len(chunks),
        "chunks": [{"id": c.id, "text": c.text[:80], "source": c.source, "head_tag": c.head_tag} for c in chunks[:50]]
    }


# ── TRIDENT HTTP RAG/App endpoint ──
# This does not split Trident. It exposes the existing ChunkStore/model tools
# through normal HTTP so the app can call RAG without using P2P/WebRTC.
if FastAPI is not None:
    app = FastAPI(title="TRIDENT RAG/MCP HTTP Bridge", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class RAGSearchRequest(BaseModel):
        query: str
        top_k: int = 3
        topK: Optional[int] = None
        head_tag: Optional[str] = None
        headTag: Optional[str] = None

    class RAGAddRequest(BaseModel):
        text: str
        source: str = "app"
        head_tag: str = "any"
        headTag: Optional[str] = None

    class RAGListRequest(BaseModel):
        head_tag: Optional[str] = None
        headTag: Optional[str] = None
        limit: int = 50

    class GenerateRequest(BaseModel):
        prompt: str
        head: Optional[str] = None
        max_tokens: int = 64
        maxTokens: Optional[int] = None
        temperature: float = 0.8
        rag_query: Optional[str] = None
        ragQuery: Optional[str] = None

    @app.get("/health")
    def health():
        store = get_store()
        return {"ok": True, "service": "trident", "chunks": len(store.chunks)}

    @app.post("/rag/search")
    def http_rag_search(req: RAGSearchRequest):
        top_k = req.topK or req.top_k or 3
        head_tag = req.headTag if req.headTag is not None else req.head_tag
        return trident_search_rag(query=req.query, top_k=top_k, head_tag=head_tag)

    @app.post("/rag/add")
    def http_rag_add(req: RAGAddRequest):
        head_tag = req.headTag or req.head_tag or "any"
        return trident_add_chunk(text=req.text, source=req.source, head_tag=head_tag)

    @app.post("/rag/list")
    def http_rag_list(req: RAGListRequest):
        head_tag = req.headTag if req.headTag is not None else req.head_tag
        result = trident_list_chunks(head_tag=head_tag)
        if req.limit is not None:
            result["chunks"] = result.get("chunks", [])[:req.limit]
        return result

    @app.post("/rag/generate")
    def http_rag_generate(req: GenerateRequest):
        return trident_generate(
            prompt=req.prompt,
            head=req.head,
            max_tokens=req.maxTokens or req.max_tokens,
            temperature=req.temperature,
            rag_query=req.ragQuery if req.ragQuery is not None else req.rag_query,
        )


if __name__ == '__main__':
    print("TRIDENT MCP Server starting...")
    print("Tools: trident_generate | trident_add_chunk | trident_search_rag | trident_router | trident_list_chunks")
    mcp.run(transport='stdio')
