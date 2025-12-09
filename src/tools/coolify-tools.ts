/**
 * Coolify-specific tools registration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CoolifyClient } from '../coolify-client.js';

export function registerCoolifyTools(
  server: Server,
  coolify: CoolifyClient,
  toolHandlers: Map<string, (args: any) => Promise<any>>
) {
  // ==================== Application Management ====================

  toolHandlers.set('list_coolify_applications', async () => {
    return await coolify.listApplications();
  });

  toolHandlers.set('get_coolify_application', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.getApplication(uuid);
  });

  toolHandlers.set(
    'update_coolify_application_env',
    async (args: { uuid: string; env: Record<string, string> }) => {
      const { uuid, env } = args;
      return await coolify.updateApplicationEnv(uuid, env);
    }
  );

  toolHandlers.set('deploy_coolify_application', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.deployApplication(uuid);
  });

  toolHandlers.set('start_coolify_application', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.startApplication(uuid);
  });

  toolHandlers.set('stop_coolify_application', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.stopApplication(uuid);
  });

  toolHandlers.set('restart_coolify_application', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.restartApplication(uuid);
  });

  // ==================== Service Management ====================

  toolHandlers.set('list_coolify_services', async () => {
    return await coolify.listServices();
  });

  toolHandlers.set('get_coolify_service', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.getService(uuid);
  });

  toolHandlers.set('start_coolify_service', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.startService(uuid);
  });

  toolHandlers.set('stop_coolify_service', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.stopService(uuid);
  });

  // ==================== Database Management ====================

  toolHandlers.set('list_coolify_databases', async () => {
    return await coolify.listDatabases();
  });

  toolHandlers.set('get_coolify_database', async (args: { uuid: string }) => {
    const { uuid } = args;
    return await coolify.getDatabase(uuid);
  });

  // ==================== Logs ====================

  toolHandlers.set('get_coolify_logs', async (args: { uuid: string; lines?: number }) => {
    const { uuid, lines = 100 } = args;
    return await coolify.getApplicationLogs(uuid, lines);
  });
}

