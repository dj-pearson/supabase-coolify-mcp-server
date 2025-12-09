/**
 * MCP Resources registration for exposing Supabase and Coolify entities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CoolifyClient } from './coolify-client.js';
import { SupabaseManager } from './supabase-client.js';

export function registerResources(
  server: Server,
  coolify: CoolifyClient,
  supabase: SupabaseManager
) {
  // Handle resource list requests
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'supabase://migrations',
          name: 'Database Migrations',
          description: 'All database migrations',
          mimeType: 'application/json',
        },
        {
          uri: 'supabase://edge-functions',
          name: 'Edge Functions',
          description: 'All deployed edge functions',
          mimeType: 'application/json',
        },
        {
          uri: 'supabase://storage-buckets',
          name: 'Storage Buckets',
          description: 'All storage buckets',
          mimeType: 'application/json',
        },
        {
          uri: 'supabase://auth-config',
          name: 'Auth Configuration',
          description: 'Authentication configuration',
          mimeType: 'application/json',
        },
        {
          uri: 'supabase://health',
          name: 'Service Health',
          description: 'Health status of all Supabase services',
          mimeType: 'application/json',
        },
        {
          uri: 'coolify://applications',
          name: 'Coolify Applications',
          description: 'All Coolify applications',
          mimeType: 'application/json',
        },
        {
          uri: 'coolify://services',
          name: 'Coolify Services',
          description: 'All Coolify services',
          mimeType: 'application/json',
        },
        {
          uri: 'coolify://databases',
          name: 'Coolify Databases',
          description: 'All Coolify databases',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Handle resource read requests
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      let data: any;
      let description: string;

      switch (uri) {
        case 'supabase://migrations': {
          const result = await supabase.listMigrations();
          data = result.data || [];
          description = 'All database migrations';
          break;
        }

        case 'supabase://edge-functions': {
          const result = await supabase.listEdgeFunctions();
          data = result.data || [];
          description = 'All deployed edge functions';
          break;
        }

        case 'supabase://storage-buckets': {
          const result = await supabase.listStorageBuckets();
          data = result.data || [];
          description = 'All storage buckets';
          break;
        }

        case 'supabase://auth-config': {
          const result = await supabase.getAuthConfig();
          data = result.data || {};
          description = 'Authentication configuration';
          break;
        }

        case 'supabase://health': {
          const result = await supabase.checkHealth();
          data = result.data || [];
          description = 'Service health status';
          break;
        }

        case 'coolify://applications': {
          const result = await coolify.listApplications();
          data = result.data || [];
          description = 'All Coolify applications';
          break;
        }

        case 'coolify://services': {
          const result = await coolify.listServices();
          data = result.data || [];
          description = 'All Coolify services';
          break;
        }

        case 'coolify://databases': {
          const result = await coolify.listDatabases();
          data = result.data || [];
          description = 'All Coolify databases';
          break;
        }

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                description,
                data,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : 'Unknown error',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  });
}

