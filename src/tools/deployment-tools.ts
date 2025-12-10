/**
 * Supabase deployment tools for Coolify
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CoolifyClient } from '../coolify-client.js';
import { SupabaseManager } from '../supabase-client.js';
import { SupabaseDeploymentConfig } from '../types.js';

export function registerDeploymentTools(
  server: Server,
  coolify: CoolifyClient,
  supabase: SupabaseManager,
  toolHandlers: Map<string, (args: any) => Promise<any>>
) {
  /**
   * Deploy a complete Supabase instance on Coolify
   */
  toolHandlers.set(
    'deploy_supabase_to_coolify',
    async (args: { name: string; config?: SupabaseDeploymentConfig }) => {
      const { name, config = {} } = args;

      try {
        // Step 1: Create the main Supabase application
        const appResult = await coolify.createApplication({
          name: `${name}-supabase`,
          description: 'Self-hosted Supabase instance',
          build_pack: 'docker',
          git_repository: 'https://github.com/supabase/supabase',
          git_branch: 'master',
        });

        if (!appResult.success || !appResult.data) {
          return {
            success: false,
            error: 'Failed to create Supabase application',
          };
        }

        const appUuid = appResult.data.uuid;

        // Step 2: Configure environment variables
        const envVars: Record<string, string> = {
          POSTGRES_VERSION: config.postgres_version || '15',
          POSTGRES_PASSWORD: generateSecurePassword(),
          JWT_SECRET: generateSecurePassword(64),
          ANON_KEY: generateSupabaseKey('anon'),
          SERVICE_ROLE_KEY: generateSupabaseKey('service_role'),
          SITE_URL: config.custom_domain || process.env.SUPABASE_URL || `https://${name}.coolify.app`,
          ENABLE_REALTIME: config.enable_realtime !== false ? 'true' : 'false',
          ENABLE_STORAGE: config.enable_storage !== false ? 'true' : 'false',
          ENABLE_AUTH: config.enable_auth !== false ? 'true' : 'false',
          ENABLE_REST: config.enable_rest !== false ? 'true' : 'false',
          ENABLE_GRAPHQL: config.enable_graphql !== false ? 'true' : 'false',
          ...config.environment_variables,
        };

        const envResult = await coolify.updateApplicationEnv(appUuid, envVars);
        if (!envResult.success) {
          return {
            success: false,
            error: 'Failed to configure environment variables',
          };
        }

        // Step 3: Deploy the application
        const deployResult = await coolify.deployApplication(appUuid);
        if (!deployResult.success) {
          return {
            success: false,
            error: 'Failed to deploy Supabase',
          };
        }

        return {
          success: true,
          data: {
            uuid: appUuid,
            name,
            status: 'deploying',
            credentials: {
              postgres_password: envVars.POSTGRES_PASSWORD,
              jwt_secret: envVars.JWT_SECRET,
              anon_key: envVars.ANON_KEY,
              service_role_key: envVars.SERVICE_ROLE_KEY,
            },
          },
          message: 'Supabase deployment started successfully. Save the credentials securely!',
        };
      } catch (error) {
        return {
          success: false,
          error: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );

  /**
   * Update an existing Supabase deployment
   */
  toolHandlers.set(
    'update_supabase_deployment',
    async (args: { uuid: string; config: Partial<SupabaseDeploymentConfig> }) => {
      const { uuid, config } = args;

      try {
        // Get current application
        const appResult = await coolify.getApplication(uuid);
        if (!appResult.success || !appResult.data) {
          return {
            success: false,
            error: 'Application not found',
          };
        }

        // Update environment variables
        const currentEnv = appResult.data.environment || {};
        const updatedEnv: Record<string, string> = {
          ...currentEnv,
        };

        if (config.postgres_version) {
          updatedEnv.POSTGRES_VERSION = config.postgres_version;
        }
        if (config.enable_realtime !== undefined) {
          updatedEnv.ENABLE_REALTIME = config.enable_realtime ? 'true' : 'false';
        }
        if (config.enable_storage !== undefined) {
          updatedEnv.ENABLE_STORAGE = config.enable_storage ? 'true' : 'false';
        }
        if (config.enable_auth !== undefined) {
          updatedEnv.ENABLE_AUTH = config.enable_auth ? 'true' : 'false';
        }
        if (config.enable_rest !== undefined) {
          updatedEnv.ENABLE_REST = config.enable_rest ? 'true' : 'false';
        }
        if (config.enable_graphql !== undefined) {
          updatedEnv.ENABLE_GRAPHQL = config.enable_graphql ? 'true' : 'false';
        }
        if (config.custom_domain) {
          updatedEnv.SITE_URL = config.custom_domain;
        }
        if (config.environment_variables) {
          Object.assign(updatedEnv, config.environment_variables);
        }

        const envResult = await coolify.updateApplicationEnv(uuid, updatedEnv);
        if (!envResult.success) {
          return {
            success: false,
            error: 'Failed to update configuration',
          };
        }

        // Restart to apply changes
        const restartResult = await coolify.restartApplication(uuid);
        if (!restartResult.success) {
          return {
            success: false,
            error: 'Failed to restart application',
          };
        }

        return {
          success: true,
          message: 'Supabase deployment updated successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );

  /**
   * Get deployment status
   */
  toolHandlers.set('get_deployment_status', async (args: { uuid: string }) => {
    const { uuid } = args;

    try {
      // Get application details
      const appResult = await coolify.getApplication(uuid);
      if (!appResult.success || !appResult.data) {
        return {
          success: false,
          error: 'Application not found',
        };
      }

      // Check Supabase health
      const healthResult = await supabase.checkHealth();
      
      return {
        success: true,
        data: {
          application: appResult.data,
          health: healthResult.success ? healthResult.data : [],
          status: appResult.data.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  });
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

/**
 * Generate a Supabase API key (simplified version)
 * In production, this should use proper JWT generation
 */
function generateSupabaseKey(role: string): string {
  // This is a simplified placeholder. In production, you should:
  // 1. Use a proper JWT library
  // 2. Sign with the JWT_SECRET
  // 3. Include proper claims
  return `eyJ${Buffer.from(role).toString('base64')}.${generateSecurePassword(32)}`;
}

