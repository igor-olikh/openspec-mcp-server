# Cache System

## ADDED Requirements

### Requirement: Server uses cache
The MCP server MUST employ a cache to speed up reads and list operations.
#### Scenario: Serving lists from cache
- **Given** The cache is populated with changes
- **When** `openspec_list` is called with `--json`
- **Then** It returns the list via cache.

### Requirement: Direct read tool
A direct read tool MUST be available.
#### Scenario: Direct file read
- **Given** A cached open spec entry
- **When** `openspec_read_file` is called
- **Then** It returns the content of the item natively and fast.
