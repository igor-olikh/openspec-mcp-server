# Proposal: Direct File Reading with In-Memory Cache

## What we are going to do
Replace the most frequent CLI-delegated operations (`list`, `show`, `status`) with native filesystem reads backed by an in-memory cache of the OpenSpec directory structure. Expose a single unified `openspec_read_file` tool that gives the AI direct access to any spec artifact by change name and file type, in one call.

## Why we need this

### The subprocess tax
Every tool call currently spawns `npx --yes @fission-ai/openspec <cmd>`. That means: npm registry check, possible package download, Node process startup, CLI bootstrap — all before useful work begins. On a cold cache or slow network this adds seconds of latency per call. In a tight AI loop (list → show → validate → update), it compounds into minutes of wasted time.

### The multi-turn token waste
When the AI wants to read a proposal, the current flow is:
1. Call `openspec_list` → parse JSON → find the change name
2. Call `openspec_show` with that name → get content

Each step costs tokens for the request, the response, and the AI's reasoning about what to do next. A direct read collapses this to a single call.

### Tool proliferation risk
The original spec proposed adding `openspec_read_active_proposal`, `openspec_read_active_design`, etc. — one tool per file type. This pollutes the AI's tool menu and creates maintenance burden. A single parameterized tool (`openspec_read_file`) with `changeName` and `fileType` parameters covers all cases cleanly.

## How we will do it

### 1. In-memory directory cache
On server startup, scan `openspec/changes/` and `openspec/specs/` once. Build a map:
```
Map<string, { path: string, files: string[] }>
```
Serve `list` queries from this map instead of shelling out. Invalidate selectively when the server handles mutating tools (`openspec_new_change`, `openspec_archive`, `openspec_init`).

### 2. Unified `openspec_read_file` tool
One new MCP tool that accepts `changeName` (or spec name) and `fileType` (proposal, design, tasks, yaml). Uses `fs.readFileSync` to return content directly. No subprocess. Microsecond latency.

### 3. Keep CLI delegation for write operations
Tools that mutate state (`init`, `new_change`, `archive`, `validate`, `update`) continue to delegate to the CLI. This avoids duplicating OpenSpec's business logic for operations where latency matters less.

## Trade-offs

**Coupling:** The server now encodes knowledge of OpenSpec's directory layout (`openspec/changes/{name}/proposal.md`). If Fission AI changes this structure, direct reads break while CLI-wrapped tools adapt automatically. Mitigation: derive paths from `.openspec.yaml` metadata rather than hardcoding, and version-check the layout on init.

**Cache staleness:** If something outside the server modifies the OpenSpec directory (manual file edits, git operations), the cache won't reflect it. Mitigation: add an `openspec_refresh_cache` tool the AI can call when it detects stale data, and auto-refresh on any mutating tool call.
