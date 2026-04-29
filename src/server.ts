import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getTools, handleToolCall } from './tools.js';
import { buildCache, OpenSpecCache } from './cache.js';

export class OpenSpecMCPServer {
  private server: Server;
  private cache: OpenSpecCache | null = null;
  private stopping: boolean = false;
  public projectPath: string = process.cwd();

  constructor() {
    this.server = new Server(
      {
        name: 'openspec-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Provide dynamic tools or static ones
      return {
        tools: getTools(),
      };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "openspec_kickoff",
            description: "Initialize an AI coding session using Fission-AI OpenSpec best practices.",
          }
        ]
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      if (request.params.name !== "openspec_kickoff") {
        throw new McpError(ErrorCode.InvalidRequest, `Prompt not found: ${request.params.name}`);
      }
      return {
        description: "Initialize an AI coding session using Fission-AI OpenSpec best practices.",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `You are an expert AI development assistant operating within a codebase managed by the Fission-AI OpenSpec framework.
Your workflow MUST be strictly spec-driven. Never write code until the specification is completely validated and active.

Follow this workflow exactly:
1. When asked to implement a feature, FIRST check if a change exists by using openspec tools (like \`openspec_status\` or \`openspec_list\`).
2. If there are no open specs for this feature, create one.
3. If an active change exists, use tools to read and validate the active specification.
4. If validation fails, DO NOT PROCEED TO CODE. Fix the spec first.
5. Once the design is validated and error-free, proceed to implement the feature by tackling the tasks sequentially.
6. Always communicate your plan clearly to the user.`
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await handleToolCall(request.params.name, request.params.arguments || {}, this.projectPath, this.cache!);
        return {
          content: [
            {
              type: 'text',
              text: result.message || 'Tool executed successfully',
            },
            ...(result.stdout ? [{ type: 'text' as const, text: `Output:\n${result.stdout}` }] : []),
            ...(result.stderr ? [{ type: 'text' as const, text: `Error Output:\n${result.stderr}` }] : [])
          ],
          isError: !result.success
        };
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  async initialize(projectPath: string) {
    this.projectPath = projectPath;
    this.cache = buildCache(projectPath);

    const transport = new StdioServerTransport();

    transport.onclose = async () => {
      await this.stop();
      process.exit(0);
    };

    transport.onerror = (error) => {
      console.error('Transport error:', error);
    };

    await this.server.connect(transport);
  }

  async stop() {
    if (this.stopping) return;
    this.stopping = true;
    try {
      await this.server.close();
    } catch (error) {
      console.error('Error closing server:', error);
    }
  }
}
