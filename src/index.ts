#!/usr/bin/env node

import { OpenSpecMCPServer } from './server.js';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] || process.cwd();
  const resolvedPath = path.resolve(projectPath);

  console.error(`Starting OpenSpec MCP Server for project: ${resolvedPath}`);
  
  const server = new OpenSpecMCPServer();
  await server.initialize(resolvedPath);

  // Handle graceful shutdown
  const shutdown = async () => {
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
