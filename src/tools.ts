import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

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
        properties: {},
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
          changeName: { type: 'string', description: 'Change name to show status for' },
          json: { type: 'boolean', description: 'Output as JSON', default: true }
        },
        required: []
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
    }
  ];
}

export async function handleToolCall(name: string, args: any, cwd: string): Promise<ToolExecutionResult> {
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
      return await runOpenSpec(['init', '--no-interactive']);
    }
    case 'openspec_update': {
      return await runOpenSpec(['update']);
    }
    case 'openspec_list': {
      const cmdArgs = ['list'];
      if (args.specs) cmdArgs.push('--specs');
      if (args.json !== false) cmdArgs.push('--json');
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_show': {
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
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_new_change': {
      const cmdArgs = ['new', 'change', `"${args.name}"`];
      if (args.description) cmdArgs.push('--description', `"${args.description}"`);
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_status': {
      const cmdArgs = ['status'];
      if (args.changeName) cmdArgs.push('--change', `"${args.changeName}"`);
      if (args.json !== false) cmdArgs.push('--json');
      return await runOpenSpec(cmdArgs);
    }
    case 'openspec_instructions': {
      const cmdArgs = ['instructions', `"${args.artifact}"`];
      if (args.changeName) cmdArgs.push('--change', `"${args.changeName}"`);
      if (args.json !== false) cmdArgs.push('--json');
      return await runOpenSpec(cmdArgs);
    }
    default:
      return { success: false, message: `Unknown tool: ${name}` };
  }
}
