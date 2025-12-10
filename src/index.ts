#!/usr/bin/env node

/**
 * Supabase Coolify MCP Server
 * Manages self-hosted Supabase on Coolify with full deployment support
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { CoolifyClient } from './coolify-client.js';
import { SupabaseManager } from './supabase-client.js';
import { SupabaseCLI } from './supabase-cli.js';
import { registerSupabaseTools } from './tools/supabase-tools.js';
import { registerSupabaseCLITools } from './tools/supabase-cli-tools.js';
import { registerCoolifyTools } from './tools/coolify-tools.js';
import { registerDeploymentTools } from './tools/deployment-tools.js';
import { registerResources } from './resources.js';
import { runStartupHealthCheck, createVerificationReport } from './health-check.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'COOLIFY_API_URL',
  'COOLIFY_API_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

// Initialize clients
const coolifyClient = new CoolifyClient({
  apiUrl: process.env.COOLIFY_API_URL!,
  apiToken: process.env.COOLIFY_API_TOKEN!,
  teamId: process.env.COOLIFY_TEAM_ID,
});

const supabaseManager = new SupabaseManager(
  {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    projectId: process.env.SUPABASE_PROJECT_ID,
    projectRef: process.env.SUPABASE_PROJECT_REF,
    functionsUrl: process.env.SUPABASE_FUNCTIONS_URL,
  },
  process.env.SUPABASE_DB_HOST
    ? {
        host: process.env.SUPABASE_DB_HOST,
        port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
        database: process.env.SUPABASE_DB_NAME || 'postgres',
        user: process.env.SUPABASE_DB_USER || 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD!,
      }
    : undefined
);

const supabaseCLI = new SupabaseCLI({
  projectRef: process.env.SUPABASE_PROJECT_REF,
  projectId: process.env.SUPABASE_PROJECT_ID,
  accessToken: process.env.SUPABASE_ACCESS_TOKEN,
  dbUrl: process.env.SUPABASE_DB_URL,
});

// Create MCP server
const server = new Server(
  {
    name: 'supabase-coolify-mcp-server',
    version: '1.2.2',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register all tools and resources
const toolHandlers = new Map<string, (args: any) => Promise<any>>();

registerSupabaseTools(server, supabaseManager, toolHandlers);
registerSupabaseCLITools(server, supabaseCLI, toolHandlers);
registerCoolifyTools(server, coolifyClient, toolHandlers);
registerDeploymentTools(server, coolifyClient, supabaseManager, toolHandlers);
registerResources(server, coolifyClient, supabaseManager);

// Register verification tool
toolHandlers.set('verify_setup', async () => {
  return await createVerificationReport(coolifyClient, supabaseManager, supabaseCLI);
});

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Array.from(toolHandlers.keys()).map((name) => {
    // Get tool metadata from the registered tools
    return getToolMetadata(name);
  });

  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolHandlers.get(name);
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const result = await handler(args || {});
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Helper function to get tool metadata
function getToolMetadata(toolName: string) {
  const toolDescriptions: Record<string, any> = {
    // Supabase Migration Tools
    list_migrations: {
      name: 'list_migrations',
      description: 'List all database migrations with their status',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    deploy_migration: {
      name: 'deploy_migration',
      description: 'Deploy a new database migration',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL migration code' },
          name: { type: 'string', description: 'Migration name' },
        },
        required: ['sql', 'name'],
      },
    },
    execute_sql: {
      name: 'execute_sql',
      description: 'Execute raw SQL query on Supabase database',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL query to execute' },
        },
        required: ['sql'],
      },
    },
    get_migration_status: {
      name: 'get_migration_status',
      description: 'Get status of a specific migration',
      inputSchema: {
        type: 'object',
        properties: {
          version: { type: 'string', description: 'Migration version' },
        },
        required: ['version'],
      },
    },

    // Migration Rollback Tools
    rollback_migration: {
      name: 'rollback_migration',
      description: 'Rollback a specific migration (optionally with down SQL)',
      inputSchema: {
        type: 'object',
        properties: {
          version: { type: 'string', description: 'Migration version to rollback' },
          down_sql: { type: 'string', description: 'SQL to execute for rollback (optional)' },
        },
        required: ['version'],
      },
    },
    rollback_to_version: {
      name: 'rollback_to_version',
      description: 'Rollback all migrations after a specific version',
      inputSchema: {
        type: 'object',
        properties: {
          version: { type: 'string', description: 'Target version to rollback to' },
        },
        required: ['version'],
      },
    },
    rollback_last_migrations: {
      name: 'rollback_last_migrations',
      description: 'Rollback the last N migrations',
      inputSchema: {
        type: 'object',
        properties: {
          count: { type: 'number', description: 'Number of migrations to rollback', default: 1 },
        },
      },
    },
    create_migration_with_rollback: {
      name: 'create_migration_with_rollback',
      description: 'Create a migration with both up and down SQL for safe rollbacks',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Migration name' },
          up_sql: { type: 'string', description: 'SQL to apply the migration' },
          down_sql: { type: 'string', description: 'SQL to rollback the migration' },
        },
        required: ['name', 'up_sql', 'down_sql'],
      },
    },
    rollback_migration_with_down_sql: {
      name: 'rollback_migration_with_down_sql',
      description: 'Rollback a migration using its stored down SQL',
      inputSchema: {
        type: 'object',
        properties: {
          version: { type: 'string', description: 'Migration version' },
        },
        required: ['version'],
      },
    },

    // Edge Functions Tools
    list_edge_functions: {
      name: 'list_edge_functions',
      description: 'List all deployed edge functions',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    deploy_edge_function: {
      name: 'deploy_edge_function',
      description: 'Deploy a new edge function',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Function name' },
          code: { type: 'string', description: 'Function code' },
          verify_jwt: { type: 'boolean', description: 'Verify JWT tokens', default: true },
        },
        required: ['name', 'code'],
      },
    },
    delete_edge_function: {
      name: 'delete_edge_function',
      description: 'Delete an edge function',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Function name' },
        },
        required: ['name'],
      },
    },
    get_edge_function_logs: {
      name: 'get_edge_function_logs',
      description: 'Get logs for an edge function',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Function name' },
          limit: { type: 'number', description: 'Number of log entries', default: 100 },
        },
        required: ['name'],
      },
    },
    invoke_edge_function: {
      name: 'invoke_edge_function',
      description: 'Invoke an edge function',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Function name' },
          payload: { type: 'object', description: 'Function payload' },
        },
        required: ['name'],
      },
    },

    // Storage Tools
    list_storage_buckets: {
      name: 'list_storage_buckets',
      description: 'List all storage buckets',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    create_storage_bucket: {
      name: 'create_storage_bucket',
      description: 'Create a new storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bucket ID' },
          public: { type: 'boolean', description: 'Make bucket public', default: false },
          file_size_limit: { type: 'number', description: 'Max file size in bytes' },
        },
        required: ['id'],
      },
    },
    delete_storage_bucket: {
      name: 'delete_storage_bucket',
      description: 'Delete a storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bucket ID' },
        },
        required: ['id'],
      },
    },

    // Auth Tools
    get_auth_config: {
      name: 'get_auth_config',
      description: 'Get authentication configuration',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    update_auth_config: {
      name: 'update_auth_config',
      description: 'Update authentication configuration',
      inputSchema: {
        type: 'object',
        properties: {
          config: { type: 'object', description: 'Auth configuration' },
        },
        required: ['config'],
      },
    },

    // Health & Status Tools
    check_supabase_health: {
      name: 'check_supabase_health',
      description: 'Check health of all Supabase services',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    get_supabase_version: {
      name: 'get_supabase_version',
      description: 'Get Supabase version information',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },

    // Coolify Tools
    list_coolify_applications: {
      name: 'list_coolify_applications',
      description: 'List all Coolify applications',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    get_coolify_application: {
      name: 'get_coolify_application',
      description: 'Get details of a specific Coolify application',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
        },
        required: ['uuid'],
      },
    },
    update_coolify_application_env: {
      name: 'update_coolify_application_env',
      description: 'Update application environment variables',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
          env: { type: 'object', description: 'Environment variables' },
        },
        required: ['uuid', 'env'],
      },
    },
    deploy_coolify_application: {
      name: 'deploy_coolify_application',
      description: 'Deploy a Coolify application',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
        },
        required: ['uuid'],
      },
    },
    start_coolify_application: {
      name: 'start_coolify_application',
      description: 'Start a Coolify application',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
        },
        required: ['uuid'],
      },
    },
    stop_coolify_application: {
      name: 'stop_coolify_application',
      description: 'Stop a Coolify application',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
        },
        required: ['uuid'],
      },
    },
    restart_coolify_application: {
      name: 'restart_coolify_application',
      description: 'Restart a Coolify application',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
        },
        required: ['uuid'],
      },
    },
    list_coolify_services: {
      name: 'list_coolify_services',
      description: 'List all Coolify services',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    get_coolify_service: {
      name: 'get_coolify_service',
      description: 'Get details of a specific Coolify service',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Service UUID' },
        },
        required: ['uuid'],
      },
    },
    start_coolify_service: {
      name: 'start_coolify_service',
      description: 'Start a Coolify service',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Service UUID' },
        },
        required: ['uuid'],
      },
    },
    stop_coolify_service: {
      name: 'stop_coolify_service',
      description: 'Stop a Coolify service',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Service UUID' },
        },
        required: ['uuid'],
      },
    },
    get_coolify_logs: {
      name: 'get_coolify_logs',
      description: 'Get application logs from Coolify',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
          lines: { type: 'number', description: 'Number of log lines', default: 100 },
        },
        required: ['uuid'],
      },
    },

    // Supabase CLI Tools
    check_cli_installed: {
      name: 'check_cli_installed',
      description: 'Check if Supabase CLI is installed and get version',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_init: {
      name: 'supabase_init',
      description: 'Initialize a new Supabase project',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path', default: '.' },
        },
      },
    },
    supabase_link: {
      name: 'supabase_link',
      description: 'Link to a remote Supabase project',
      inputSchema: {
        type: 'object',
        properties: {
          project_ref: { type: 'string', description: 'Project reference ID' },
          password: { type: 'string', description: 'Database password (optional)' },
        },
        required: ['project_ref'],
      },
    },
    supabase_start: {
      name: 'supabase_start',
      description: 'Start local Supabase development environment',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_stop: {
      name: 'supabase_stop',
      description: 'Stop local Supabase development environment',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_status: {
      name: 'supabase_status',
      description: 'Get status of local Supabase services',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_db_diff: {
      name: 'supabase_db_diff',
      description: 'Generate migration from database schema changes',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Migration name' },
        },
        required: ['name'],
      },
    },
    supabase_db_push: {
      name: 'supabase_db_push',
      description: 'Push local migrations to remote database',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_db_reset: {
      name: 'supabase_db_reset',
      description: 'Reset local database to initial state',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_migration_new: {
      name: 'supabase_migration_new',
      description: 'Create a new migration file',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Migration name' },
        },
        required: ['name'],
      },
    },
    supabase_migration_list: {
      name: 'supabase_migration_list',
      description: 'List all migrations (CLI)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_migration_repair: {
      name: 'supabase_migration_repair',
      description: 'Repair migration history',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    supabase_functions_deploy: {
      name: 'supabase_functions_deploy',
      description: 'Deploy edge functions using Supabase CLI',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name (optional, deploys all if omitted)' },
        },
      },
    },
    supabase_functions_serve: {
      name: 'supabase_functions_serve',
      description: 'Serve edge functions locally',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name (optional)' },
        },
      },
    },
    supabase_gen_types: {
      name: 'supabase_gen_types',
      description: 'Generate TypeScript types from database schema',
      inputSchema: {
        type: 'object',
        properties: {
          output: { type: 'string', description: 'Output file path', default: 'types/supabase.ts' },
        },
      },
    },
    supabase_cli_execute: {
      name: 'supabase_cli_execute',
      description: 'Execute arbitrary Supabase CLI command',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'CLI command (without "supabase" prefix)' },
        },
        required: ['command'],
      },
    },

    // Deployment Tools
    deploy_supabase_to_coolify: {
      name: 'deploy_supabase_to_coolify',
      description: 'Deploy a complete Supabase instance on Coolify',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Deployment name' },
          config: { type: 'object', description: 'Deployment configuration' },
        },
        required: ['name'],
      },
    },
    update_supabase_deployment: {
      name: 'update_supabase_deployment',
      description: 'Update an existing Supabase deployment',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
          config: { type: 'object', description: 'Updated configuration' },
        },
        required: ['uuid', 'config'],
      },
    },
    get_deployment_status: {
      name: 'get_deployment_status',
      description: 'Get status of Supabase deployment on Coolify',
      inputSchema: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'Application UUID' },
        },
        required: ['uuid'],
      },
    },

    // System Tools
    verify_setup: {
      name: 'verify_setup',
      description: 'Verify system setup and check health of all services (Coolify, Supabase, CLI)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  };

  return toolDescriptions[toolName] || {
    name: toolName,
    description: `Execute ${toolName}`,
    inputSchema: { type: 'object', properties: {} },
  };
}

// Start server
async function main() {
  // Run startup health checks
  await runStartupHealthCheck(coolifyClient, supabaseManager, supabaseCLI);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✅ Supabase Coolify MCP Server running on stdio');
  console.error('');
  console.error('📊 Configuration:');
  console.error(`   Coolify API: ${process.env.COOLIFY_API_URL}`);
  console.error(`   Supabase URL: ${process.env.SUPABASE_URL}`);
  console.error('');
  console.error('🛠️  Available: 52 tools, 8 resources');
  console.error('   • Supabase: Migrations, Rollback, Edge Functions, Storage, Auth');
  console.error('   • Coolify: Applications, Services, Deployment');
  console.error('   • CLI: Local dev, Type generation, Testing');
  console.error('');
  console.error('💡 Run "verify_setup" tool for detailed system diagnostics');
  console.error('');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

