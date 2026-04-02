# Design: Structured JSON Outputs

## Architecture
- The MCP server needs to receive clean data so it doesn't just pipe ANSI colored terminal strings to the AI.

## Technical Details
- Modify `execAsync` execution calls.
- If OpenSpec CLI supports JSON natively, inject the CLI flag. Otherwise, clean standard stdout to extract objects.
