# Tasks

## Phase 1: Cache Module
- [ ] Create `src/cache.ts` with `OpenSpecCache` interface and `OpenSpecEntry` type
- [ ] Implement `buildCache(projectPath)` — scan `openspec/changes/` and `openspec/specs/`, populate Map
- [ ] Implement `refreshCache(cache, projectPath)` — clear and rebuild the Map in-place
- [ ] Implement `readSpecFile(cache, projectPath, name, fileType)` — lookup + `fs.readFileSync`
- [ ] Handle edge cases: missing `openspec/` dir, empty directories, unreadable files

## Phase 2: Tool Registration
- [ ] Add `openspec_read_file` tool definition in `getTools()` with name, fileType params and enum constraint
- [ ] Add `openspec_refresh_cache` tool definition in `getTools()`
- [ ] Update `ListToolsRequestSchema` handler if needed (currently auto-picks up from `getTools()`)

## Phase 3: Handler Integration
- [ ] Expand `handleToolCall` signature to accept `OpenSpecCache` parameter
- [ ] Add `openspec_read_file` switch case — call `readSpecFile`, format response
- [ ] Add `openspec_refresh_cache` switch case — call `refreshCache`, return confirmation
- [ ] Modify `openspec_list` case — serve from cache when JSON mode is on, fall back to CLI otherwise
- [ ] Add `refreshCache()` calls after `openspec_init`, `openspec_new_change`, `openspec_archive`, `openspec_update` cases

## Phase 4: Server Wiring
- [ ] Import `buildCache` and `OpenSpecCache` in `server.ts`
- [ ] Add `private cache: OpenSpecCache | null` field to `OpenSpecMCPServer`
- [ ] Call `buildCache()` in `initialize()` after setting `projectPath`
- [ ] Pass `this.cache` to `handleToolCall` in the `CallToolRequestSchema` handler

## Phase 5: Testing & Validation
- [ ] Test `openspec_read_file` with valid change name + each file type
- [ ] Test `openspec_read_file` with nonexistent change name — verify helpful error
- [ ] Test `openspec_read_file` with valid change but missing file type — verify it lists available files
- [ ] Test cache refresh after `openspec_new_change` — verify new entry appears immediately
- [ ] Test `openspec_list` serves from cache and matches CLI output
- [ ] Test cold start with no `openspec/` directory — verify graceful degradation
- [ ] Build project (`npm run build`) and verify no TypeScript errors
