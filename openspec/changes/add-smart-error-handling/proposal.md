# Proposal: Smart Error Handling

## What we are going to do
We want to dramatically improve the feedback the AI gets when it runs an invalid command. If `openspec_validate` fails, rather than just returning "Command Failed: exit code 1", we will intercept the exact error and give the AI a helpful, coaching reply.

## Why we need this
If the AI incorrectly writes a spec (e.g. it forgets to include the "Tasks" header in the design file), OpenSpec validation turns red and fails. The AI sometimes gets confused by raw CLI errors. If we coach the AI ("Hey AI, your validation failed specifically because you forgot the 'Tasks' header in design.md"), it can immediately fix it without human intervention! This creates a self-healing AI loop.

## How we will do it
1. In `src/tools.ts`, inside the `catch (error)` block for `execAsync`, we will read `error.stderr` instead of just crashing.
2. We will analyze the `stderr` string. If it contains "missing section", we map it to a friendly message.
3. We will return this friendly, parsed diagnostic string natively through the standard MCP response payload back to the assistant.
