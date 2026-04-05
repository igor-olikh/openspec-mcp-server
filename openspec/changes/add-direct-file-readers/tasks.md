# Tasks

## Phase 1: Cache Module
- [x] Create `src/cache.ts` with `OpenSpecCache` interface and `OpenSpecEntry` type
- [x] Implement `buildCache(projectPath)` — scan `openspec/changes/` and `openspec/specs/`, populate Map
- [x] Implement `refreshCache(cache, projectPath)` — clear and rebuild the Map in-place
- [x] Implement `readSpecFile(cache, projectPath, name, fileType)` — lookup + `fs.readFileSync`
- [x] Handle edge cases: missing `openspec/` dir, empty directories, unreadable files

## Phase 2: Tool Registration
- [x] Add `openspec_read_file` tool definition in `getTools()` with name, fileType params and enum constraint
- [x] Add `openspec_refresh_cache` tool definition in `getTools()`
- [x] Update `ListToolsRequestSchema` handler if needed (currently auto-picks up from `getTools()`)

## Phase 3: Handler Integration
- [x] Expand `handleToolCall` signature to accept `OpenSpecCache` parameter
- [x] Add `openspec_read_file` switch case — call `readSpecFile`, format response
- [x] Add `openspec_refresh_cache` switch case — call `refreshCache`, return confirmation
- [x] Modify `openspec_list` case — serve from cache when JSON mode is on, fall back to CLI otherwise
- [x] Add `refreshCache()` calls after `openspec_init`, `openspec_new_change`, `openspec_archive`, `openspec_update` cases

## Phase 4: Server Wiring
- [x] Import `buildCache` and `OpenSpecCache` in `server.ts`
- [x] Add `private cache: OpenSpecCache | null` field to `OpenSpecMCPServer`
- [x] Call `buildCache()` in `initialize()` after setting `projectPath`
- [x] Pass `this.cache` to `handleToolCall` in the `CallToolRequestSchema` handler

## Phase 5: Testing & Validation
- [x] Test `openspec_read_file` with valid change name + each file type
- [x] Test `openspec_read_file` with nonexistent change name — verify helpful error
- [x] Test `openspec_read_file` with valid change but missing file type — verify it lists available files
- [x] Test cache refresh after `openspec_new_change` — verify new entry appears immediately
- [x] Test `openspec_list` serves from cache and matches CLI output
- [x] Test cold start with no `openspec/` directory — verify graceful degradation
- [x] Build project (`npm run build`) and verify no TypeScript errors
