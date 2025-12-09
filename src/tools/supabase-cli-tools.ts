/**
 * Supabase CLI tools registration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SupabaseCLI } from '../supabase-cli.js';

export function registerSupabaseCLITools(
  server: Server,
  supabaseCLI: SupabaseCLI,
  toolHandlers: Map<string, (args: any) => Promise<any>>
) {
  // ==================== CLI Status & Setup ====================

  toolHandlers.set('check_cli_installed', async () => {
    return await supabaseCLI.checkCLIInstalled();
  });

  toolHandlers.set('supabase_init', async (args: { path?: string }) => {
    const { path = '.' } = args;
    return await supabaseCLI.init(path);
  });

  toolHandlers.set('supabase_link', async (args: { project_ref: string; password?: string }) => {
    const { project_ref, password } = args;
    return await supabaseCLI.link(project_ref, password);
  });

  // ==================== Local Development ====================

  toolHandlers.set('supabase_start', async () => {
    return await supabaseCLI.start();
  });

  toolHandlers.set('supabase_stop', async () => {
    return await supabaseCLI.stop();
  });

  toolHandlers.set('supabase_status', async () => {
    return await supabaseCLI.status();
  });

  // ==================== Database Operations ====================

  toolHandlers.set('supabase_db_diff', async (args: { name: string }) => {
    const { name } = args;
    return await supabaseCLI.dbDiff(name);
  });

  toolHandlers.set('supabase_db_push', async () => {
    return await supabaseCLI.dbPush();
  });

  toolHandlers.set('supabase_db_reset', async () => {
    return await supabaseCLI.dbReset();
  });

  // ==================== Migration Management ====================

  toolHandlers.set('supabase_migration_new', async (args: { name: string }) => {
    const { name } = args;
    return await supabaseCLI.migrationNew(name);
  });

  toolHandlers.set('supabase_migration_list', async () => {
    return await supabaseCLI.migrationList();
  });

  toolHandlers.set('supabase_migration_repair', async () => {
    return await supabaseCLI.migrationRepair();
  });

  // ==================== Edge Functions ====================

  toolHandlers.set('supabase_functions_deploy', async (args: { function_name?: string }) => {
    const { function_name } = args;
    return await supabaseCLI.functionsDeploy(function_name);
  });

  toolHandlers.set('supabase_functions_serve', async (args: { function_name?: string }) => {
    const { function_name } = args;
    return await supabaseCLI.functionsServe(function_name);
  });

  // ==================== Code Generation ====================

  toolHandlers.set('supabase_gen_types', async (args: { output?: string }) => {
    const { output = 'types/supabase.ts' } = args;
    return await supabaseCLI.genTypes(output);
  });

  // ==================== Advanced ====================

  toolHandlers.set('supabase_cli_execute', async (args: { command: string }) => {
    const { command } = args;
    return await supabaseCLI.execute(command);
  });
}

