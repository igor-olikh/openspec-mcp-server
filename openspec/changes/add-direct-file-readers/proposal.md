# Proposal: Direct File Reading Tools

## What we are going to do
We are going to add specific, highly targeted tools to the MCP server like `openspec_read_active_proposal` and `openspec_read_active_design`. 

## Why we need this
Currently, if the AI wants to read the active proposal, it has to first figure out what the active change is, guess the directory structure (`openspec/changes/feature/proposal.md`), and use a generic system file reader to fetch it. This wastes tokens, takes multiple chat turns, and invites errors. By giving the AI a direct tool, it gets exactly the context it needs in a single action.

## How we will do it
1. Intercept the standard `openspec status` to dynamically read which feature branch is currently marked as "active".
2. Add a new tool called `openspec_read_active_spec` in `src/tools.ts`.
3. When the AI calls this tool, we use Node's `fs.readFileSync` to grab the content of the `proposal.md` or `design.md` for that active feature, and return the raw text back to the AI.
