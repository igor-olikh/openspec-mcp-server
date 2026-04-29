import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { OpenSpecCache, readSpecFile, refreshCache, lookupEntry } from './cache.js';

const execAsync = promisify(exec);

export interface ToolExecutionResult {
  success: boolean;
  message?: string;
  stdout?: string;
  stderr?: string;
}

const OPENSPEC_CMD = 'npx --yes @fission-ai/openspec';

export function getTools(): Tool[] {
  return [
    {
      name: 'openspec_init',
      description: 'Initialize OpenSpec in your project',
      inputSchema: {
        type: 'object',
        properties: {
          tools: {
            type: 'string',
            description: 'AI tools to configure non-interactively. Use "all", "none", or a comma-separated list (e.g. "claude,cursor,codex"). Defaults to "claude".',
            default: 'claude'
          },
          force: {
            type: 'boolean',
            description: 'Auto-cleanup legacy files without prompting'
          }
        },
        required: []
      }
    },
    {
      name: 'openspec_update',
      description: 'Update OpenSpec instruction files',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'openspec_list',
      description: 'List items (changes or specs). Returns a JSON array when --json is used.',
      inputSchema: {
        type: 'object',
        properties: {
          specs: { type: 'boolean', description: 'List specs instead of changes' },
          json: { type: 'boolean', description: 'Output as JSON', default: true }
        },
        required: []
      }
    },
    {
      name: 'openspec_show',
      description: 'Show a change or spec. Use type to specify if it is ambiguous.',
      inputSchema: {
        type: 'object',
        properties: {
          itemName: { type: 'string', description: 'Name of the item to show' },
          type: { type: 'string', description: 'Item type: "change" or "spec"' },
          json: { type: 'boolean', description: 'Output as JSON', default: true }
        },
        required: ['itemName']
      }
    },
    {
      name: 'openspec_validate',
      description: 'Validate a change proposal or spec',
      inputSchema: {
        type: 'object',
        properties: {
          itemName: { type: 'string', description: 'Name of the change to validate (optional)' },
          all: { type: 'boolean', description: 'Validate all changes and specs' },
          strict: { type: 'boolean', description: 'Enable strict validation mode' },
          json: { type: 'boolean', description: 'Output as JSON' }
        },
        required: []
      }
    },
    {
      name: 'openspec_archive',
      description: 'Archive a completed change and update main specs',
      inputSchema: {
        type: 'object',
        properties: {
          changeName: { type: 'string', description: 'Name of the change to archive' },
          skipSpecs: { type: 'boolean', description: 'Skip spec updates' }
        },
        required: ['changeName']
      }
    },
    {
      name: 'openspec_new_change',
      description: 'Create a new change directory',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the change' },
          description: { type: 'string', description: 'Description to add to README.md' }
        },
        required: ['name']
      }
    },
    {
      name: 'openspec_status',
      description: 'Display artifact completion status for a change',
      inputSchema: {
        type: 'object',
        properties: {
          changeName: { type: 'string', description: 'Change name to show status for (required by current CLI)' },
          json: { type: 'boolean', description: 'Output as JSON', default: true }
        },
        required: ['changeName']
      }
    },
    {
      name: 'openspec_instructions',
      description: 'Output enriched instructions for an artifact or apply',
      inputSchema: {
        type: 'object',
        properties: {
          artifact: { type: 'string', description: 'Artifact name (e.g. design.md, tasks.md) or "apply"' },
          changeName: { type: 'string', description: 'Change name' },
          json: { type: 'boolean', description: 'Output as JSON' }
        },
        required: ['artifact']
      }
    },
    {
      name: 'openspec_read_file',
      description: 'Read any OpenSpec artifact directly. Much faster than show — use this when you need file contents.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Change or spec name (e.g. "add-dark-mode")' },
          fileType: {
            type: 'string',
            description: 'File to read',
            enum: ['proposal.md', 'design.md', 'tasks.md', '.openspec.yaml']
          },
          type: {
            type: 'string',
            description: 'Item type to disambiguate if a change and spec share the same name. If omitted, prefers changes.',
            enum: ['change', 'spec']
          }
        },
        required: ['name', 'fileType']
      }
    },
    {
      name: 'openspec_refresh_cache',
      description: 'Force refresh the cached directory listing. Use if you suspect changes were made outside OpenSpec tools.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  ];
}

export async function handleToolCall(name: string, args: any, cwd: string, cache: OpenSpecCache): Promise<ToolExecutionResult> {
  const runOpenSpec = async (callArgs: string[]): Promise<ToolExecutionResult> => {
    const cmd = `${OPENSPEC_CMD} ${callArgs.join(' ')}`;
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd });
      return { success: true, stdout, stderr, message: `Ran: ${cmd}` };
    } catch (error: any) {
      return { 
        success: false, 
        stdout: error.stdout, 
        stderr: error.stderr, 
        message: `Command failed: ${error.message}` 
      };
    }
  };

  switch (name) {
    case 'openspec_init': {
      const tools = typeof args.tools === 'string' && args.tools.length > 0 ? args.tools : 'claude';
      const cmdArgs = ['init', '--tools', `"${tools}"`];
      if (args.force) cmdArgs.push('--force');
      const res = await runOpenSpec(cmdArgs);
      refreshCache(cache, cwd);
      return res;
    }
    case 'openspec_update': {
      const res = await runOpenSpec(['update']);
      refreshCache(cache, cwd);
      return res;
    }
    case 'openspec_list': {
      const typeFilter: 'change' | 'spec' = args.specs ? 'spec' : 'change';
      const items = Array.from(cache.entries.values())
        .filter(e => e.type === typeFilter)
        .map(e => ({ name: e.name, type: e.type, files: e.files }));

      return {
        success: true,
        stdout: JSON.stringify({ [args.specs ? 'specs' : 'changes']: items }, null, 2),
        message: items.length === 0
          ? `No ${typeFilter}s found in openspec/ (cwd: ${cwd}). Run openspec_init if the project is not initialized yet.`
          : 'Served from cache'
      };
    }
    case 'openspec_show': {
      const entry = lookupEntry(cache, args.itemName, args.type);
      if (!entry) {
        const available = Array.from(cache.entries.values())
          .filter(e => !args.type || e.type === args.type)
          .map(e => `${e.type}:${e.name}`);
        return {
          success: false,
          message: `No ${args.type ?? 'change or spec'} named '${args.itemName}' found. Available: ${available.length > 0 ? available.join(', ') : '(none)'}`
        };
      }
      const cmdArgs = ['show', `"${args.itemName}"`];
      if (args.type) cmdArgs.push('--type', args.type);
      if (args.json !== false) cmdArgs.push('--json');
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_validate': {
      const cmdArgs = ['validate'];
      if (args.itemName) cmdArgs.push(`"${args.itemName}"`);
      if (args.all) cmdArgs.push('--all');
      if (args.strict) cmdArgs.push('--strict');
      if (args.json !== false) cmdArgs.push('--json');
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_archive': {
      const cmdArgs = ['archive', `"${args.changeName}"`, '--yes'];
      if (args.skipSpecs) cmdArgs.push('--skip-specs');
      const res = await runOpenSpec(cmdArgs);
      refreshCache(cache, cwd);
      return res;
    }
    case 'openspec_new_change': {
      const cmdArgs = ['new', 'change', `"${args.name}"`];
      if (args.description) cmdArgs.push('--description', `"${args.description}"`);
      const res = await runOpenSpec(cmdArgs);
      refreshCache(cache, cwd);
      return res;
    }
    case 'openspec_status': {
      if (!args.changeName) {
        const changes = Array.from(cache.entries.values())
          .filter(e => e.type === 'change')
          .map(e => e.name);
        return {
          success: false,
          message: `openspec_status requires 'changeName'. Available changes: ${changes.length > 0 ? changes.join(', ') : '(none)'}`
        };
      }
      const cmdArgs = ['status', '--change', `"${args.changeName}"`];
      if (args.json !== false) cmdArgs.push('--json');
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_instructions': {
      const cmdArgs = ['instructions', `"${args.artifact}"`];
      if (args.changeName) cmdArgs.push('--change', `"${args.changeName}"`);
      if (args.json !== false) cmdArgs.push('--json');
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_read_file': {
      const entry = lookupEntry(cache, args.name, args.type);
      if (!entry) {
        return { success: false, message: `No change or spec named '${args.name}' found. Run openspec_list to see available items.` };
      }
      const content = readSpecFile(cache, cwd, args.name, args.fileType, args.type);
      if (content === null) {
        return { success: false, message: `File '${args.fileType}' does not exist for '${args.name}'. Available files: ${entry.files.join(', ')}` };
      }
      return { success: true, stdout: content, message: `Read ${args.fileType} from ${entry.type}:${args.name}` };
    }
    case 'openspec_refresh_cache': {
      refreshCache(cache, cwd);
      return { success: true, message: 'Cache refreshed successfully.' };
    }
    default:
      return { success: false, message: `Unknown tool: ${name}` };
  }
}
