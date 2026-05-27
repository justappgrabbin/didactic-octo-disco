create extension if not exists vector;
create table if not exists departments (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, created_at timestamptz default now());
create table if not exists mesh_nodes (id uuid primary key default gen_random_uuid(), department_id uuid references departments(id) on delete set null, title text not null, source_type text, kind text, content text, summary text, state text default 'classified', position jsonb default '{"x":160,"y":160,"z":0}', metadata jsonb default '{}', edges text[] default '{}', embedding vector(1536), created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists agent_messages (id uuid primary key default gen_random_uuid(), node_id uuid references mesh_nodes(id) on delete set null, role text not null, content text not null, metadata jsonb default '{}', created_at timestamptz default now());
create table if not exists morph_events (id uuid primary key default gen_random_uuid(), event_type text not null, payload jsonb default '{}', created_at timestamptz default now());
create index if not exists mesh_nodes_department_idx on mesh_nodes(department_id);
create index if not exists mesh_nodes_kind_idx on mesh_nodes(kind);
