# OpenSpec MCP Server

A Model Context Protocol (MCP) server for [OpenSpec](https://github.com/Fission-AI/OpenSpec).

This MCP server provides tools to interface with the OpenSpec CLI directly from AI assistants via the standard Model Context Protocol. Rather than maintaining custom integrations or complex scripts, AI agents can use this MCP server to initiate changes, propose specs, validate rules, and commit completions using the well-defined OpenSpec process.

## Supported Tools

- **`openspec_init`**: Initialize OpenSpec in the current directory (`openspec init`).
- **`openspec_update`**: Update OpenSpec instructions and settings inside the project (`openspec update`).
- **`openspec_list`**: List active changes and specs (`openspec list`).
- **`openspec_show`**: Display detailed info for a spec or change (`openspec show <name>`).
- **`openspec_validate`**: Validate active changes against specifications (`openspec validate`).
- **`openspec_archive`**: Mark tasks completely and archive the completed OpenSpec change (`openspec archive <name>`).
- **`openspec_new_change`**: Create a new OpenSpec change branch logic/directory (`openspec new change <name>`).
- **`openspec_status`**: Get a summary status over an active change proposal (`openspec status`).
- **`openspec_instructions`**: Get AI enriched instructions for building particular artifacts (`openspec instructions <name>`).

## Running with MCP Clients

```bash
# General format for MCP clients to execute this server
npx -y @igor-olikh/openspec-mcp-server <path_to_project>
```

### Example with Claude Desktop App
Add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "openspec": {
      "command": "npx",
      "args": [
        "-y",
        "@igor-olikh/openspec-mcp-server",
        "/absolute/path/to/your/project"
      ]
    }
  }
}
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Compile TypeScript:
```bash
npm run build
```

3. Run locally:
```bash
npm run dev
```
