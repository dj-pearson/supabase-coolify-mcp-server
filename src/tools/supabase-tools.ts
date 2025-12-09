/**
 * Supabase-specific tools registration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SupabaseManager } from '../supabase-client.js';
import { validateInput } from '../validation.js';
import * as schemas from '../validation.js';

export function registerSupabaseTools(
  server: Server,
  supabase: SupabaseManager,
  toolHandlers: Map<string, (args: any) => Promise<any>>
) {
  // ==================== Migration Tools ====================

  toolHandlers.set('list_migrations', async () => {
    return await supabase.listMigrations();
  });

  toolHandlers.set('deploy_migration', async (args: { sql: string; name: string }) => {
    const validated = validateInput(schemas.deployMigrationSchema, args);
    return await supabase.deployMigration(validated.sql, validated.name);
  });

  toolHandlers.set('execute_sql', async (args: { sql: string }) => {
    const validated = validateInput(schemas.executeSQLSchema, args);
    return await supabase.executeSQL(validated.sql);
  });

  toolHandlers.set('get_migration_status', async (args: { version: string }) => {
    const { version } = args;
    return await supabase.getMigrationStatus(version);
  });

  // ==================== Edge Functions Tools ====================

  toolHandlers.set('list_edge_functions', async () => {
    return await supabase.listEdgeFunctions();
  });

  toolHandlers.set(
    'deploy_edge_function',
    async (args: { name: string; code: string; verify_jwt?: boolean }) => {
      const validated = validateInput(schemas.deployEdgeFunctionSchema, args);
      return await supabase.deployEdgeFunction(validated.name, validated.code, validated.verify_jwt);
    }
  );

  toolHandlers.set('delete_edge_function', async (args: { name: string }) => {
    const { name } = args;
    return await supabase.deleteEdgeFunction(name);
  });

  toolHandlers.set('get_edge_function_logs', async (args: { name: string; limit?: number }) => {
    const { name, limit = 100 } = args;
    return await supabase.getEdgeFunctionLogs(name, limit);
  });

  toolHandlers.set('invoke_edge_function', async (args: { name: string; payload?: any }) => {
    const { name, payload } = args;
    return await supabase.invokeEdgeFunction(name, payload);
  });

  // ==================== Storage Tools ====================

  toolHandlers.set('list_storage_buckets', async () => {
    return await supabase.listStorageBuckets();
  });

  toolHandlers.set(
    'create_storage_bucket',
    async (args: { id: string; public?: boolean; file_size_limit?: number }) => {
      const validated = validateInput(schemas.createStorageBucketSchema, args);
      return await supabase.createStorageBucket(validated.id, validated.public, validated.file_size_limit);
    }
  );

  toolHandlers.set('delete_storage_bucket', async (args: { id: string }) => {
    const { id } = args;
    return await supabase.deleteStorageBucket(id);
  });

  // ==================== Auth Tools ====================

  toolHandlers.set('get_auth_config', async () => {
    return await supabase.getAuthConfig();
  });

  toolHandlers.set('update_auth_config', async (args: { config: any }) => {
    const { config } = args;
    return await supabase.updateAuthConfig(config);
  });

  // ==================== Health & Status Tools ====================

  toolHandlers.set('check_supabase_health', async () => {
    return await supabase.checkHealth();
  });

  toolHandlers.set('get_supabase_version', async () => {
    return await supabase.getVersion();
  });

  toolHandlers.set('get_realtime_config', async () => {
    return await supabase.getRealtimeConfig();
  });

  // ==================== Migration Rollback Tools ====================

  toolHandlers.set('rollback_migration', async (args: { version: string; down_sql?: string }) => {
    const { version, down_sql } = args;
    return await supabase.rollbackMigration(version, down_sql);
  });

  toolHandlers.set('rollback_to_version', async (args: { version: string }) => {
    const { version } = args;
    return await supabase.rollbackToVersion(version);
  });

  toolHandlers.set('rollback_last_migrations', async (args: { count?: number }) => {
    const { count = 1 } = args;
    return await supabase.rollbackLastMigrations(count);
  });

  toolHandlers.set(
    'create_migration_with_rollback',
    async (args: { name: string; up_sql: string; down_sql: string }) => {
      const validated = validateInput(schemas.createMigrationWithRollbackSchema, args);
      return await supabase.createMigrationWithRollback(validated.name, validated.up_sql, validated.down_sql);
    }
  );

  toolHandlers.set('rollback_migration_with_down_sql', async (args: { version: string }) => {
    const { version } = args;
    return await supabase.rollbackMigrationWithDownSql(version);
  });
}

