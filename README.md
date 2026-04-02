# OpenSpec MCP Server (AI Assistant Plugin)

[![NPM Version](https://img.shields.io/npm/v/@igor-olikh/openspec-mcp-server?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@igor-olikh/openspec-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dt/@igor-olikh/openspec-mcp-server?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@igor-olikh/openspec-mcp-server)

Welcome! This is a simple bridge (plugin) that connects **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** to your favorite AI coding assistant (like **IBM Bob**, **Codex**, or **Claude Desktop**).

## What is this and why do I need it?
When you want your AI to build a new feature, you usually just type it into the chat. But as projects grow, the AI can forget things, get confused, or write messy code.

**OpenSpec** is a system that solves this. It forces the AI to create a clear "specification" (a plan) before it writes any code. It organizes your plan into neat folders (`proposal`, `design`, `tasks`) so you can review it.

However, your AI doesn't automatically know how to use OpenSpec. **That is what this server does!** It gives your AI the "tools" it needs to automatically create these folders, list tasks, and mark them as complete as it writes code for you.

---

## How to Connect Your AI

To use this, you need to tell your AI assistant where this server is located. The setup simply depends on which AI assistant you use.

### Option 1: Connecting to IBM Bob

If you are using [IBM Bob](https://bob.ibm.com/):
1. In the IBM Bob IDE, click the **three dots** next to the gear icon in the upper right corner of the chat window and select **MCP servers**.
2. Click **Open** next to "Global MCPs" to edit your settings file (usually saved at `~/.bob/settings/mcp_settings.json`).
3. Add the `openspec` server to the `mcpServers` object:

```json
{
  "mcpServers": {
    "openspec": {
      "command": "npx",
      "args": [
        "-y",
        "@igor-olikh/openspec-mcp-server"
      ]
    }
  }
}
```
4. Save the file and restart IBM Bob!

### Option 2: Connecting to Codex

Codex has a built-in user interface to easily add these plugins. 
You can add it quickly by running this terminal command:

```bash
codex mcp add openspec-server npx -y @igor-olikh/openspec-mcp-server
```

**Or, manually through the Codex User Interface:**
1. Open the **"Connect to a custom MCP"** box in Codex.
2. **Name**: `openspec` 
3. **Mode**: Leave as `STDIO`
4. **Command to launch**: `npx`
5. **Arguments**: Click `+ Add argument` twice and paste exactly:
   - First argument: `-y`
   - Second argument: `@igor-olikh/openspec-mcp-server`
6. **Working directory**: Leave this blank! (This allows Codex to dynamically use OpenSpec inside whichever project you currently have open).
7. Save it!

### Option 3: Connecting to Claude Desktop App

If you prefer using the Claude Desktop application:
1. Open your Claude configuration file (usually located at `~/Library/Application Support/Claude/claude_desktop_config.json` on Mac).
2. Add the `openspec` server to it:

```json
{
  "mcpServers": {
    "openspec": {
      "command": "npx",
      "args": [
        "-y",
        "@igor-olikh/openspec-mcp-server"
      ]
    }
  }
}
```
3. Save the file and restart Claude Desktop.

---

## How do I use it?

Once connected, you don't need to do anything technical. You just talk to your AI like normal, but ask it to use OpenSpec!

**Example Chat Prompts:**
* *"Hey Bob, I want to add a dark mode feature to this application. Please use OpenSpec to propose and validate it."*
* *"What is the OpenSpec status of our current project?"*
* *"List all the OpenSpec changes we are currently working on."*

The AI will automatically use the tools below to handle the rest!

---

## For Developers (Under the Hood)

This server exposes the official `@fission-ai/openspec` CLI commands as Model Context Protocol (MCP) JSON-RPC tools.

**Available AI Tools:**
- `openspec_init`: Starts OpenSpec in a project.
- `openspec_new_change`: Creates a folder for a new feature proposal.
- `openspec_status`: Checks how much of the feature is done.
- `openspec_validate`: Checks if the code matches the plan.
- `openspec_archive`: Marks the feature as 100% completed.
- `openspec_list`: Shows all current tasks.
- `openspec_show`: Reads a specific task.
- `openspec_update`: Updates OpenSpec rules.
- `openspec_instructions`: Reads AI instructions for building parts of the plan.

### Development Setup
If you want to modify this server's code:
1. `npm install` (Installs dependencies)
2. `npm run build` (Compiles the code)
3. `npm run start` (Runs the server to test standard input/output)

---

## Upcoming Features (Planned via OpenSpec)
This server is actively evolving! The following features are currently being designed utilizing OpenSpec and will be implemented soon:

- ⏳ **Built-in MCP Prompts**: A pre-made "cheat sheet" standard prompt (e.g., `openspec_kickoff`) that automatically injects massive hidden rules into your AI, steering it to behave perfectly when generating structured features.
- ⏳ **Structured JSON Outputs**: Replacing raw, colorful terminal output with parsed JavaScript objects, preventing the AI from misreading states and reducing hallucinations.
- ⏳ **Direct File Readers**: Highly targeted tools (e.g., `openspec_read_active_proposal`) allowing the AI to skip hunting around your directory structure to read active designs.
- ⏳ **Smart Error Handling**: Coaching the LLM when OpenSpec validations fail (e.g. intercepting terminal errors to output: *"Hey, you forgot the 'Tasks' header in design.md"*).

