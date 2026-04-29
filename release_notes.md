## Bug Fixes

- **`openspec_init` is working again**: Removed the `--no-interactive` flag that was dropped in `@fission-ai/openspec` 1.2.0. The tool now uses the current `--tools <list>` flag (defaults to `claude`) and exposes an optional `force` flag.
- **`openspec_list` no longer fails on uninitialized projects**: Previously, when `openspec/` (or `openspec/changes/`) was missing, the server fell through to the CLI which errored with `No OpenSpec changes directory found`. The cache now always serves `openspec_list` from the filesystem and returns an empty array with a helpful hint instead. This also covers projects that only have `openspec/specs/`.
- **`openspec_show` returns a clear error for unknown items**: Added cache-based validation so calls with a missing `itemName` get `Available: change:foo, spec:bar` instead of an opaque CLI error.
- **`openspec_status` requires `changeName`**: The current CLI requires `--change <id>`. The argument is now required in the schema, and if it is missing the server returns a clear hint with the list of available changes.
- **No more `RangeError` on shutdown**: Removed redundant `process.stdin` `end`/`error` handlers and made `stop()` idempotent. The transport's `onclose` is now the single shutdown path, eliminating the recursive `server.close()` → `onclose` → `stop()` loop that produced a "Maximum call stack size exceeded" trace when clients disconnected.

## Compatibility

- Verified against `@fission-ai/openspec` **1.2.0**.
