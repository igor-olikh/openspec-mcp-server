# Design: Built-in MCP Prompts

## Architecture
- Use `@modelcontextprotocol/sdk` to hook into `server.setRequestHandler(ListPromptsRequestSchema, ...)` and `server.setRequestHandler(GetPromptRequestSchema, ...)`.
- Define an `openspec_kickoff` prompt definition containing the rules of engagement.

## Technical Details
- The prompt context must be robust enough to instruct the LLM on exactly which tools to call first (e.g. `openspec_init` if missing, then `openspec_list`).
