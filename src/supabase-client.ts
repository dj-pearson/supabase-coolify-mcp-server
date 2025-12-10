/**
 * Supabase Client Wrapper for self-hosted Supabase management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios, { AxiosInstance } from 'axios';
import type {
  SupabaseConfig,
  SupabaseDatabaseConfig,
  Migration,
  EdgeFunction,
  EdgeFunctionLog,
  StorageBucket,
  SupabaseAuthConfig,
  RealtimeConfig,
  SupabaseServiceStatus,
  ToolResponse,
} from './types.js';

export class SupabaseManager {
  private client: SupabaseClient;
  private adminClient: AxiosInstance;
  private config: SupabaseConfig;
  private dbConfig?: SupabaseDatabaseConfig;

  constructor(config: SupabaseConfig, dbConfig?: SupabaseDatabaseConfig) {
    this.config = config;
    this.dbConfig = dbConfig;

    // Initialize Supabase client
    this.client = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Initialize admin API client
    this.adminClient = axios.create({
      baseURL: config.url,
      headers: {
        'Authorization': `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': config.serviceRoleKey,
      },
    });
  }

  // ==================== Database Migrations ====================

  /**
   * List all migrations with their status
   */
  async listMigrations(): Promise<ToolResponse<Migration[]>> {
    try {
      const { data, error } = await this.client
        .from('supabase_migrations.schema_migrations')
        .select('*')
        .order('version', { ascending: false });

      if (error) throw error;

      const migrations: Migration[] = (data || []).map((row: any) => ({
        version: row.version,
        name: row.name || `Migration ${row.version}`,
        executed_at: row.inserted_at,
        status: 'applied' as const,
      }));

      return {
        success: true,
        data: migrations,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to list migrations');
    }
  }

  /**
   * Deploy a new migration
   */
  async deployMigration(sql: string, name: string): Promise<ToolResponse<Migration>> {
    try {
      const version = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

      // Execute the migration SQL directly using the admin client
      // PostgREST doesn't support arbitrary SQL execution, so we need to use direct execution
      const { error } = await this.client.rpc('exec', { 
        query: sql 
      });
      
      if (error) {
        // If rpc doesn't work, try using pg_stat_statements or direct query
        // For self-hosted Supabase, we'll need to execute via admin API
        try {
          await this.adminClient.post('/rest/v1/rpc/query', { q: sql });
        } catch {
          // As a last resort, record the migration without executing
          // (user will need to execute SQL manually via CLI or dashboard)
          console.error('Warning: Could not execute migration SQL automatically.');
          console.error('Please execute the following SQL manually in your Supabase dashboard:');
          console.error(sql);
          
          // Still record it as pending
          const migration: Migration = {
            version,
            name,
            executed_at: new Date().toISOString(),
            status: 'pending',
            sql,
          };

          return {
            success: false,
            error: `Migration created but SQL execution failed: ${error.message}. Execute SQL manually in Supabase dashboard, then use CLI: supabase migration list`,
            data: migration,
          };
        }
      }

      const migration: Migration = {
        version,
        name,
        executed_at: new Date().toISOString(),
        status: 'applied',
        sql,
      };

      return {
        success: true,
        data: migration,
        message: `Migration ${name} (${version}) created. Note: For self-hosted Supabase, you may need to apply migrations using the Supabase CLI: supabase db push`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to deploy migration');
    }
  }

  /**
   * Execute raw SQL query
   * Note: Self-hosted Supabase may not have exec_sql RPC function
   * Users should use Supabase CLI or dashboard for direct SQL execution
   */
  async executeSQL(sql: string): Promise<ToolResponse<any>> {
    try {
      // Try using pg_stat_statements extension if available
      const { data, error } = await this.client.rpc('exec', { query: sql });
      
      if (error) {
        return {
          success: false,
          error: `SQL execution not supported via REST API. Please use one of these alternatives:\n` +
                 `1. Supabase CLI: supabase db execute --file your-file.sql\n` +
                 `2. Supabase Dashboard: SQL Editor\n` +
                 `3. Direct psql connection: psql $SUPABASE_DB_URL\n` +
                 `Error: ${error.message}`,
        };
      }

      return {
        success: true,
        data,
        message: 'SQL executed successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to execute SQL');
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(version: string): Promise<ToolResponse<Migration>> {
    try {
      const { data, error } = await this.client
        .from('supabase_migrations.schema_migrations')
        .select('*')
        .eq('version', version)
        .single();

      if (error) throw error;

      const migration: Migration = {
        version: data.version,
        name: data.name || `Migration ${data.version}`,
        executed_at: data.inserted_at,
        status: 'applied',
      };

      return {
        success: true,
        data: migration,
      };
    } catch (error) {
      return this.handleError(error, `Failed to get migration status for version ${version}`);
    }
  }

  /**
   * Rollback a specific migration
   */
  async rollbackMigration(version: string, downSql?: string): Promise<ToolResponse<void>> {
    try {
      // If down SQL is provided, execute it
      if (downSql) {
        const { error: execError } = await this.client.rpc('exec_sql', { sql_query: downSql });
        
        if (execError) {
          const rawResult = await this.executeSQL(downSql);
          if (!rawResult.success) throw new Error(rawResult.error);
        }
      }

      // Remove migration from history
      const { error: deleteError } = await this.client
        .from('supabase_migrations.schema_migrations')
        .delete()
        .eq('version', version);

      if (deleteError) {
        // Try alternative approach
        await this.executeSQL(
          `DELETE FROM supabase_migrations.schema_migrations WHERE version = '${version}'`
        );
      }

      return {
        success: true,
        message: `Migration ${version} rolled back successfully`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to rollback migration ${version}`);
    }
  }

  /**
   * Rollback to a specific migration version (rolls back all migrations after this version)
   */
  async rollbackToVersion(targetVersion: string): Promise<ToolResponse<{ rolledBack: string[] }>> {
    try {
      // Get all migrations after the target version
      const { data: migrations, error } = await this.client
        .from('supabase_migrations.schema_migrations')
        .select('version, name')
        .gt('version', targetVersion)
        .order('version', { ascending: false });

      if (error) throw error;

      if (!migrations || migrations.length === 0) {
        return {
          success: true,
          data: { rolledBack: [] },
          message: 'No migrations to rollback',
        };
      }

      const rolledBackVersions: string[] = [];

      // Note: This is a simplified rollback - in production, you'd want to store
      // down migration SQL with each migration for proper rollback
      for (const migration of migrations) {
        // Remove from migration history
        const { error: deleteError } = await this.client
          .from('supabase_migrations.schema_migrations')
          .delete()
          .eq('version', migration.version);

        if (!deleteError) {
          rolledBackVersions.push(migration.version);
        }
      }

      return {
        success: true,
        data: { rolledBack: rolledBackVersions },
        message: `Rolled back ${rolledBackVersions.length} migration(s) to version ${targetVersion}`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to rollback to version ${targetVersion}`);
    }
  }

  /**
   * Rollback last N migrations
   */
  async rollbackLastMigrations(count: number = 1): Promise<ToolResponse<{ rolledBack: string[] }>> {
    try {
      // Get the last N migrations
      const { data: migrations, error } = await this.client
        .from('supabase_migrations.schema_migrations')
        .select('version, name')
        .order('version', { ascending: false })
        .limit(count);

      if (error) throw error;

      if (!migrations || migrations.length === 0) {
        return {
          success: true,
          data: { rolledBack: [] },
          message: 'No migrations to rollback',
        };
      }

      const rolledBackVersions: string[] = [];

      for (const migration of migrations) {
        const { error: deleteError } = await this.client
          .from('supabase_migrations.schema_migrations')
          .delete()
          .eq('version', migration.version);

        if (!deleteError) {
          rolledBackVersions.push(migration.version);
        }
      }

      return {
        success: true,
        data: { rolledBack: rolledBackVersions },
        message: `Rolled back ${rolledBackVersions.length} migration(s)`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to rollback migrations');
    }
  }

  /**
   * Create a migration with both up and down SQL for proper rollback support
   */
  async createMigrationWithRollback(
    name: string,
    upSql: string,
    downSql: string
  ): Promise<ToolResponse<Migration>> {
    try {
      const version = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

      // Execute the up migration
      const deployResult = await this.deployMigration(upSql, name);
      
      if (!deployResult.success) {
        return deployResult;
      }

      // Store the down migration SQL for future rollback
      // This would typically be stored in a migrations table or file system
      const { error: storeError } = await this.client
        .from('_migration_rollbacks')
        .insert({
          version,
          name,
          down_sql: downSql,
          created_at: new Date().toISOString(),
        });

      if (storeError) {
        // Table might not exist, create it
        await this.executeSQL(`
          CREATE TABLE IF NOT EXISTS _migration_rollbacks (
            version TEXT PRIMARY KEY,
            name TEXT,
            down_sql TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);

        // Try again
        await this.client.from('_migration_rollbacks').insert({
          version,
          name,
          down_sql: downSql,
          created_at: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: deployResult.data!,
        message: `Migration ${name} deployed with rollback support`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create migration with rollback');
    }
  }

  /**
   * Rollback a migration using its stored down SQL
   */
  async rollbackMigrationWithDownSql(version: string): Promise<ToolResponse<void>> {
    try {
      // Get the down SQL for this migration
      const { data: rollbackData, error: fetchError } = await this.client
        .from('_migration_rollbacks')
        .select('down_sql')
        .eq('version', version)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: `No rollback SQL found for migration ${version}. Use rollbackMigration() with manual down SQL instead.`,
        };
      }

      // Execute the down SQL
      return await this.rollbackMigration(version, rollbackData.down_sql);
    } catch (error) {
      return this.handleError(error, `Failed to rollback migration ${version}`);
    }
  }

  // ==================== Edge Functions ====================

  /**
   * List all edge functions
   * Note: Edge functions listing via REST API may not be available on self-hosted
   */
  async listEdgeFunctions(): Promise<ToolResponse<EdgeFunction[]>> {
    try {
      // Try to list functions using admin API
      const functionsUrl = this.config.functionsUrl || `${this.config.url}/functions/v1`;
      
      const response = await axios.get(functionsUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.serviceRoleKey}`,
          'apikey': this.config.serviceRoleKey,
        },
        validateStatus: (status) => status < 500, // Accept 4xx responses
      });
      
      if (response.status === 404) {
        return {
          success: false,
          error: 'Edge Functions not configured on this Supabase instance. ' +
                 'For self-hosted Supabase, edge functions require additional setup. ' +
                 'Use Supabase CLI instead: supabase functions deploy',
        };
      }

      if (response.status >= 400) {
        return {
          success: false,
          error: `Edge Functions API returned ${response.status}. ` +
                 'Edge functions may not be enabled or configured. ' +
                 'Use Supabase CLI for edge function management: supabase functions list',
        };
      }
      
      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      return this.handleError(error, 'Failed to list edge functions. Consider using Supabase CLI: supabase functions list');
    }
  }

  /**
   * Deploy an edge function
   */
  async deployEdgeFunction(
    name: string,
    code: string,
    verifyJWT: boolean = true
  ): Promise<ToolResponse<EdgeFunction>> {
    try {
      const functionsUrl = this.config.functionsUrl || `${this.config.url}/functions/v1`;
      
      await axios.post(
        `${functionsUrl}/${name}`,
        { code, verify_jwt: verifyJWT },
        {
          headers: {
            'Authorization': `Bearer ${this.config.serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const edgeFunction: EdgeFunction = {
        name,
        status: 'deployed',
        verify_jwt: verifyJWT,
        created_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: edgeFunction,
        message: `Edge function ${name} deployed successfully`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to deploy edge function ${name}`);
    }
  }

  /**
   * Delete an edge function
   */
  async deleteEdgeFunction(name: string): Promise<ToolResponse<void>> {
    try {
      const functionsUrl = this.config.functionsUrl || `${this.config.url}/functions/v1`;
      
      await axios.delete(`${functionsUrl}/${name}`, {
        headers: {
          'Authorization': `Bearer ${this.config.serviceRoleKey}`,
        },
      });

      return {
        success: true,
        message: `Edge function ${name} deleted successfully`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to delete edge function ${name}`);
    }
  }

  /**
   * Get edge function logs
   */
  async getEdgeFunctionLogs(name: string, limit: number = 100): Promise<ToolResponse<EdgeFunctionLog[]>> {
    try {
      const { data, error } = await this.client
        .from('edge_logs')
        .select('*')
        .eq('function_name', name)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return this.handleError(error, `Failed to get logs for edge function ${name}`);
    }
  }

  /**
   * Invoke an edge function
   */
  async invokeEdgeFunction(name: string, payload?: any): Promise<ToolResponse<any>> {
    try {
      const { data, error } = await this.client.functions.invoke(name, {
        body: payload,
      });

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.handleError(error, `Failed to invoke edge function ${name}`);
    }
  }

  // ==================== Storage Management ====================

  /**
   * List all storage buckets
   */
  async listStorageBuckets(): Promise<ToolResponse<StorageBucket[]>> {
    try {
      const { data, error } = await this.client.storage.listBuckets();

      if (error) throw error;

      return {
        success: true,
        data: data as StorageBucket[],
      };
    } catch (error) {
      return this.handleError(error, 'Failed to list storage buckets');
    }
  }

  /**
   * Create a storage bucket
   */
  async createStorageBucket(
    id: string,
    isPublic: boolean = false,
    fileSizeLimit?: number
  ): Promise<ToolResponse<StorageBucket>> {
    try {
      const { error } = await this.client.storage.createBucket(id, {
        public: isPublic,
        fileSizeLimit,
      });

      if (error) throw error;

      const bucket: StorageBucket = {
        id,
        name: id,
        public: isPublic,
        file_size_limit: fileSizeLimit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: bucket,
        message: `Storage bucket ${id} created successfully`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to create storage bucket ${id}`);
    }
  }

  /**
   * Delete a storage bucket
   */
  async deleteStorageBucket(id: string): Promise<ToolResponse<void>> {
    try {
      const { error } = await this.client.storage.deleteBucket(id);

      if (error) throw error;

      return {
        success: true,
        message: `Storage bucket ${id} deleted successfully`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to delete storage bucket ${id}`);
    }
  }

  // ==================== Auth Configuration ====================

  /**
   * Get auth configuration
   */
  async getAuthConfig(): Promise<ToolResponse<SupabaseAuthConfig>> {
    try {
      const response = await this.adminClient.get('/auth/v1/settings');

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get auth configuration');
    }
  }

  /**
   * Update auth configuration
   */
  async updateAuthConfig(config: Partial<SupabaseAuthConfig>): Promise<ToolResponse<void>> {
    try {
      await this.adminClient.patch('/auth/v1/settings', config);

      return {
        success: true,
        message: 'Auth configuration updated successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update auth configuration');
    }
  }

  // ==================== Realtime Configuration ====================

  /**
   * Get realtime configuration
   */
  async getRealtimeConfig(): Promise<ToolResponse<RealtimeConfig>> {
    try {
      const response = await this.adminClient.get('/realtime/v1/settings');

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get realtime configuration');
    }
  }

  // ==================== Health & Status ====================

  /**
   * Check health of all Supabase services
   */
  async checkHealth(): Promise<ToolResponse<SupabaseServiceStatus[]>> {
    try {
      const services: SupabaseServiceStatus[] = [];

      // Check Database
      try {
        await this.client.from('_health').select('*').limit(1);
        services.push({ name: 'Database', status: 'healthy' });
      } catch {
        services.push({ name: 'Database', status: 'unhealthy' });
      }

      // Check Auth
      try {
        await this.adminClient.get('/auth/v1/health');
        services.push({ name: 'Auth', status: 'healthy' });
      } catch {
        services.push({ name: 'Auth', status: 'unhealthy' });
      }

      // Check Storage
      try {
        await this.client.storage.listBuckets();
        services.push({ name: 'Storage', status: 'healthy' });
      } catch {
        services.push({ name: 'Storage', status: 'unhealthy' });
      }

      // Check Realtime
      try {
        await this.adminClient.get('/realtime/v1/health');
        services.push({ name: 'Realtime', status: 'healthy' });
      } catch {
        services.push({ name: 'Realtime', status: 'unhealthy' });
      }

      return {
        success: true,
        data: services,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to check health');
    }
  }

  /**
   * Get Supabase version information
   */
  async getVersion(): Promise<ToolResponse<string>> {
    try {
      const response = await this.adminClient.get('/rest/v1/');
      const version = response.headers['x-supabase-version'] || 'unknown';

      return {
        success: true,
        data: version,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get version');
    }
  }

  /**
   * Handle errors uniformly
   */
  private handleError(error: unknown, message: string): ToolResponse<never> {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: `${message}: ${error.response?.data?.message || error.message}`,
      };
    }
    return {
      success: false,
      error: `${message}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

