# Proposal: Built-in MCP Prompts

## What we are going to do
We want to add a feature called "MCP Prompts" directly into the server. This gives the AI a pre-made "cheat sheet" standard prompt (like `openspec_kickoff`) that provides a massive set of hidden rules on how it should behave when using OpenSpec.

## Why we need this
Right now, every time you chat with Codex or Claude, you have to manually tell it: "Please use OpenSpec, remember to create a proposal first, don't write code until the design is done." 
If you forget to say that, the AI might act wildly. With MCP Prompts, the AI is instantly injected with all the necessary system instructions and guardrails automatically when you click the prompt.

## How we will do it
1. Use the `@modelcontextprotocol/sdk` to define a `ListPromptsRequest` and `GetPromptRequest` handler in our `src/server.ts`.
2. Write a deeply robust instructional prompt text (the "cheat sheet").
3. Expose it so that Codex users can see it as a clickable Quick Action in their chat UI.
