# Design: Direct File Readers with In-Memory Cache

## Architecture Overview

The change introduces two new modules and modifies the existing tool handler:

```
src/
├── index.ts          # (unchanged) Entry point
├── server.ts         # Modified: injects cache into tool handler
├── tools.ts          # Modified: new tool definition + cache-aware handler
└── cache.ts          # NEW: OpenSpec directory cache
```

## Module: `cache.ts`

### Data Structures

```typescript
interface OpenSpecEntry {
  name: string;
  type: 'change' | 'spec';
  path: string;            // absolute path to the entry directory
  files: string[];         // filenames present (e.g. ['proposal.md', 'design.md', 'tasks.md', '.openspec.yaml'])
}

interface OpenSpecCache {
  entries: Map<string, OpenSpecEntry>;
  lastRefresh: number;     // Date.now() timestamp
}
```

### Functions

**`buildCache(projectPath: string): OpenSpecCache`**
- Reads `openspec/changes/` and `openspec/specs/` using `fs.readdirSync`
- For each subdirectory, lists files and creates an `OpenSpecEntry`
- Returns the populated cache
- Called once on server startup in `server.ts` → `initialize()`

**`refreshCache(cache: OpenSpecCache, projectPath: string): void`**
- Rebuilds the cache in-place (mutates the existing Map)
- Called automatically after any mutating tool (`openspec_init`, `openspec_new_change`, `openspec_archive`, `openspec_update`)

**`readSpecFile(cache: OpenSpecCache, projectPath: string, name: string, fileType: string): string | null`**
- Looks up the entry in cache by name
- Resolves the file path: `${entry.path}/${fileType}`
- Reads and returns content via `fs.readFileSync(path, 'utf-8')`
- Returns `null` if entry or file doesn't exist

## Modified: `tools.ts`

### New Tool Definition

```typescript
{
  name: 'openspec_read_file',
  description: 'Read any OpenSpec artifact directly. Much faster than show — use this when you need file contents.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Change or spec name (e.g. "add-dark-mode")' },
      fileType: {
        type: 'string',
        description: 'File to read',
        enum: ['proposal.md', 'design.md', 'tasks.md', '.openspec.yaml']
      }
    },
    required: ['name', 'fileType']
  }
}
```

### New Tool Definition: `openspec_refresh_cache`

```typescript
{
  name: 'openspec_refresh_cache',
  description: 'Force refresh the cached directory listing. Use if you suspect changes were made outside OpenSpec tools.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}
```

### Handler Changes

The `handleToolCall` function signature expands to accept the cache:

```typescript
export async function handleToolCall(
  name: string,
  args: any,
  cwd: string,
  cache: OpenSpecCache
): Promise<ToolExecutionResult>
```

New switch cases:

- **`openspec_read_file`**: calls `readSpecFile(cache, cwd, args.name, args.fileType)`, returns content or "file not found" error
- **`openspec_refresh_cache`**: calls `refreshCache(cache, cwd)`, returns confirmation
- **`openspec_list`** (modified): when `args.json !== false`, serves from cache instead of CLI. Falls back to CLI if cache is empty.

After mutating tools (`openspec_init`, `openspec_new_change`, `openspec_archive`, `openspec_update`), the handler calls `refreshCache()` before returning.

## Modified: `server.ts`

### Initialization

```typescript
import { buildCache, OpenSpecCache } from './cache.js';

export class OpenSpecMCPServer {
  private server: Server;
  private cache: OpenSpecCache | null = null;
  public projectPath: string = process.cwd();

  async initialize(projectPath: string) {
    this.projectPath = projectPath;
    this.cache = buildCache(projectPath);
    // ... rest of existing init
  }
}
```

### CallToolRequestSchema Handler

Passes `this.cache` to `handleToolCall`:

```typescript
const result = await handleToolCall(
  request.params.name,
  request.params.arguments || {},
  this.projectPath,
  this.cache!
);
```

## Performance Impact

| Operation | Before (CLI) | After (Cache/FS) |
|-----------|-------------|-------------------|
| List changes | ~800ms–2s (npx + CLI) | <1ms (Map lookup) |
| Read a file | ~800ms–2s (npx + CLI) | <5ms (fs.readFileSync) |
| New change | ~800ms–2s (unchanged) | ~800ms–2s + ~1ms cache refresh |

## Error Handling

- **Missing entry**: return `{ success: false, message: "No change or spec named '{name}' found. Run openspec_list to see available items." }`
- **Missing file**: return `{ success: false, message: "File '{fileType}' does not exist for '{name}'. Available files: [...]" }` — list what IS available to help the AI self-correct
- **Cache empty on startup** (no openspec/ dir): cache initializes as empty Map. Direct read tools return clear error suggesting `openspec_init`. CLI-delegated tools work normally.
