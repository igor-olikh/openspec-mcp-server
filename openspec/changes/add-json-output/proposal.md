# Proposal: Structured JSON Outputs

## What we are going to do
We are going to change our tool wrappers (`openspec_list`, `openspec_status`, etc.) to request structured JSON output from the underlying OpenSpec CLI, rather than taking the raw colorful terminal text.

## Why we need this
When the AI (like Codex) asks for the status of a project, handing it raw terminal text (which often includes weird color codes or spacing) makes it harder for the AI to understand. AI models reason exponentially better when they are fed clean, predictable JSON objects representing the exact status of files and tasks. This minimizes hallucinations and mistakes.

## How we will do it
1. Modify `src/tools.ts` to append a `--json` or `--format=json` flag when calling `execAsync` for the Fission-AI OpenSpec package.
2. Parse that JSON output natively in our server (`JSON.parse(stdout)`).
3. Format and return it cleanly to the MCP protocol response. If OpenSpec doesn't yet support `--json`, we will write a tiny parser script to clean the terminal text into a structured response.
