import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getTools, handleToolCall } from './tools.js';

export class OpenSpecMCPServer {
  private server: Server;
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await handleToolCall(request.params.name, request.params.arguments || {}, this.projectPath);
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

    // Connect to stdio transport
    const transport = new StdioServerTransport();

    transport.onclose = async () => {
      await this.stop();
      process.exit(0);
    };

    await this.server.connect(transport);
    
    process.stdin.on('end', async () => {
      await this.stop();
      process.exit(0);
    });

    process.stdin.on('error', async (error) => {
      console.error('stdin error:', error);
      await this.stop();
      process.exit(1);
    });
  }

  async stop() {
    try {
      await this.server.close();
    } catch (error) {
      console.error('Error closing server:', error);
    }
  }
}
