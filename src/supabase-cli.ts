/**
 * Supabase CLI Integration
 * Provides tools to interact with the Supabase CLI for enhanced development workflows
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import type { ToolResponse } from './types.js';

const execAsync = promisify(exec);

export interface SupabaseCLIConfig {
  projectRef?: string;
  projectId?: string;
  accessToken?: string;
  dbUrl?: string;
}

export class SupabaseCLI {
  private config: SupabaseCLIConfig;

  constructor(config: SupabaseCLIConfig) {
    this.config = config;
  }

  /**
   * Check if Supabase CLI is installed
   */
  async checkCLIInstalled(): Promise<ToolResponse<{ installed: boolean; version?: string }>> {
    try {
      const { stdout } = await execAsync('supabase --version');
      const version = stdout.trim();

      return {
        success: true,
        data: {
          installed: true,
          version,
        },
      };
    } catch {
      return {
        success: false,
        data: {
          installed: false,
        },
        error: 'Supabase CLI is not installed. Install with: npm install -g supabase',
      };
    }
  }

  /**
   * Initialize a new Supabase project
   */
  async init(projectPath: string = '.'): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync(`supabase init`, {
        cwd: projectPath,
      });

      return {
        success: true,
        data: stdout,
        message: 'Supabase project initialized successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to initialize Supabase project');
    }
  }

  /**
   * Link to a remote Supabase project
   */
  async link(projectRef: string, password?: string): Promise<ToolResponse<string>> {
    try {
      let command = `supabase link --project-ref ${projectRef}`;
      
      if (password) {
        command += ` --password ${password}`;
      }

      const { stdout } = await execAsync(command);

      return {
        success: true,
        data: stdout,
        message: `Successfully linked to project ${projectRef}`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to link to Supabase project');
    }
  }

  /**
   * Start local Supabase development environment
   */
  async start(): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync('supabase start');

      return {
        success: true,
        data: stdout,
        message: 'Supabase local environment started',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to start Supabase');
    }
  }

  /**
   * Stop local Supabase development environment
   */
  async stop(): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync('supabase stop');

      return {
        success: true,
        data: stdout,
        message: 'Supabase local environment stopped',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to stop Supabase');
    }
  }

  /**
   * Get status of local Supabase services
   */
  async status(): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync('supabase status');

      return {
        success: true,
        data: stdout,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get Supabase status');
    }
  }

  /**
   * Generate migration from database schema changes
   */
  async dbDiff(name: string): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync(`supabase db diff -f ${name}`);

      return {
        success: true,
        data: stdout,
        message: `Migration ${name} generated successfully`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to generate migration');
    }
  }

  /**
   * Push local migrations to remote database
   */
  async dbPush(): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync('supabase db push');

      return {
        success: true,
        data: stdout,
        message: 'Migrations pushed successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to push migrations');
    }
  }

  /**
   * Reset local database
   */
  async dbReset(): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync('supabase db reset');

      return {
        success: true,
        data: stdout,
        message: 'Database reset successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to reset database');
    }
  }

  /**
   * Deploy edge functions
   */
  async functionsDeploy(functionName?: string): Promise<ToolResponse<string>> {
    try {
      const command = functionName
        ? `supabase functions deploy ${functionName}`
        : 'supabase functions deploy';

      const { stdout } = await execAsync(command);

      return {
        success: true,
        data: stdout,
        message: functionName
          ? `Function ${functionName} deployed successfully`
          : 'All functions deployed successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to deploy functions');
    }
  }

  /**
   * Serve edge functions locally
   */
  async functionsServe(functionName?: string): Promise<ToolResponse<string>> {
    try {
      // This is a long-running command, so we'll return immediately
      const child = spawn('supabase', ['functions', 'serve', ...(functionName ? [functionName] : [])], {
        detached: true,
        stdio: 'ignore',
      });

      child.unref();

      return {
        success: true,
        message: functionName
          ? `Function ${functionName} is now being served locally`
          : 'All functions are now being served locally',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to serve functions');
    }
  }

  /**
   * Generate TypeScript types from database schema
   */
  async genTypes(output: string = 'types/supabase.ts'): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync(`supabase gen types typescript --local > ${output}`);

      return {
        success: true,
        data: stdout,
        message: `Types generated successfully at ${output}`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to generate types');
    }
  }

  /**
   * Create a new migration file
   */
  async migrationNew(name: string): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync(`supabase migration new ${name}`);

      return {
        success: true,
        data: stdout,
        message: `Migration file created: ${name}`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create migration');
    }
  }

  /**
   * List all migrations
   */
  async migrationList(): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync('supabase migration list');

      return {
        success: true,
        data: stdout,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to list migrations');
    }
  }

  /**
   * Repair migration history
   */
  async migrationRepair(): Promise<ToolResponse<string>> {
    try {
      const { stdout } = await execAsync('supabase migration repair --status applied');

      return {
        success: true,
        data: stdout,
        message: 'Migration history repaired',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to repair migration history');
    }
  }

  /**
   * Execute arbitrary Supabase CLI command
   */
  async execute(command: string): Promise<ToolResponse<string>> {
    try {
      const { stdout, stderr } = await execAsync(`supabase ${command}`);

      return {
        success: true,
        data: stdout || stderr,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to execute command');
    }
  }

  /**
   * Handle errors uniformly
   */
  private handleError(error: unknown, message: string): ToolResponse<never> {
    if (error instanceof Error) {
      // Check if it's an exec error with stderr
      const execError = error as any;
      const errorMessage = execError.stderr || execError.message;
      
      return {
        success: false,
        error: `${message}: ${errorMessage}`,
      };
    }
    return {
      success: false,
      error: `${message}: Unknown error`,
    };
  }
}

