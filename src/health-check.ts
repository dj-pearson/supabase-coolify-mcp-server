/**
 * Health check system for verifying Coolify and Supabase connectivity
 * Runs on startup and provides a verification tool
 */

import { CoolifyClient } from './coolify-client.js';
import { SupabaseManager } from './supabase-client.js';
import { SupabaseCLI } from './supabase-cli.js';
import type { ToolResponse } from './types.js';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning' | 'unknown';
  message: string;
  details?: any;
  timestamp: string;
}

export interface SystemHealthReport {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  timestamp: string;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    warnings: number;
  };
}

export class HealthChecker {
  constructor(
    private coolify: CoolifyClient,
    private supabase: SupabaseManager,
    private supabaseCLI: SupabaseCLI
  ) {}

  /**
   * Run all health checks
   */
  async checkAll(): Promise<SystemHealthReport> {
    const checks: HealthCheckResult[] = [];

    // Run all checks in parallel
    const results = await Promise.allSettled([
      this.checkCoolifyConnection(),
      this.checkCoolifyAuth(),
      this.checkSupabaseConnection(),
      this.checkSupabaseAuth(),
      this.checkSupabaseDatabase(),
      this.checkSupabaseCLI(),
    ]);

    // Collect results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        checks.push({
          service: 'Unknown',
          status: 'unhealthy',
          message: `Check failed: ${result.reason}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      warnings: checks.filter(c => c.status === 'warning').length,
    };

    // Determine overall status
    let overall_status: 'healthy' | 'degraded' | 'unhealthy';
    if (summary.unhealthy > 0) {
      overall_status = 'unhealthy';
    } else if (summary.warnings > 0) {
      overall_status = 'degraded';
    } else {
      overall_status = 'healthy';
    }

    return {
      overall_status,
      checks,
      timestamp: new Date().toISOString(),
      summary,
    };
  }

  /**
   * Check Coolify connection
   */
  private async checkCoolifyConnection(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const result = await this.coolify.listApplications();
      const duration = Date.now() - start;

      if (result.success) {
        return {
          service: 'Coolify Connection',
          status: 'healthy',
          message: `Connected successfully (${duration}ms)`,
          details: { response_time: duration, applications_count: result.data?.length || 0 },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          service: 'Coolify Connection',
          status: 'unhealthy',
          message: result.error || 'Failed to connect',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        service: 'Coolify Connection',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Coolify authentication
   */
  private async checkCoolifyAuth(): Promise<HealthCheckResult> {
    try {
      const result = await this.coolify.listApplications();
      
      if (result.success) {
        return {
          service: 'Coolify Authentication',
          status: 'healthy',
          message: 'API token is valid',
          timestamp: new Date().toISOString(),
        };
      } else if (result.error?.includes('401') || result.error?.includes('Unauthorized')) {
        return {
          service: 'Coolify Authentication',
          status: 'unhealthy',
          message: 'Invalid API token or expired',
          details: { suggestion: 'Generate a new API token from Coolify dashboard' },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          service: 'Coolify Authentication',
          status: 'warning',
          message: 'Unable to verify authentication',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        service: 'Coolify Authentication',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Auth check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Supabase connection
   */
  private async checkSupabaseConnection(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const result = await this.supabase.getVersion();
      const duration = Date.now() - start;

      if (result.success) {
        return {
          service: 'Supabase Connection',
          status: 'healthy',
          message: `Connected successfully (${duration}ms)`,
          details: { response_time: duration, version: result.data },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          service: 'Supabase Connection',
          status: 'unhealthy',
          message: result.error || 'Failed to connect',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        service: 'Supabase Connection',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Supabase authentication
   */
  private async checkSupabaseAuth(): Promise<HealthCheckResult> {
    try {
      const result = await this.supabase.listMigrations();
      
      if (result.success) {
        return {
          service: 'Supabase Authentication',
          status: 'healthy',
          message: 'Service role key is valid',
          timestamp: new Date().toISOString(),
        };
      } else if (result.error?.includes('401') || result.error?.includes('JWT')) {
        return {
          service: 'Supabase Authentication',
          status: 'unhealthy',
          message: 'Invalid service role key or expired JWT',
          details: { suggestion: 'Check SUPABASE_SERVICE_ROLE_KEY in environment' },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          service: 'Supabase Authentication',
          status: 'warning',
          message: 'Unable to verify authentication',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        service: 'Supabase Authentication',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Auth check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Supabase database access
   */
  private async checkSupabaseDatabase(): Promise<HealthCheckResult> {
    try {
      const result = await this.supabase.executeSQL('SELECT 1 as test;');
      
      if (result.success) {
        return {
          service: 'Supabase Database',
          status: 'healthy',
          message: 'Database is accessible',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          service: 'Supabase Database',
          status: 'warning',
          message: 'Database access issue (migrations may still work)',
          details: { error: result.error },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        service: 'Supabase Database',
        status: 'warning',
        message: 'Unable to verify database (migrations may still work)',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Supabase CLI availability
   */
  private async checkSupabaseCLI(): Promise<HealthCheckResult> {
    try {
      const result = await this.supabaseCLI.checkCLIInstalled();
      
      if (result.success && result.data?.installed) {
        return {
          service: 'Supabase CLI',
          status: 'healthy',
          message: `CLI installed (${result.data.version})`,
          details: { version: result.data.version },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          service: 'Supabase CLI',
          status: 'warning',
          message: 'CLI not installed (CLI tools will not work)',
          details: { suggestion: 'Install with: npm install -g supabase' },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        service: 'Supabase CLI',
        status: 'warning',
        message: 'CLI not available (CLI tools will not work)',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Quick startup check - only critical services
   */
  async quickCheck(): Promise<{ healthy: boolean; message: string; issues: string[] }> {
    const issues: string[] = [];

    // Check Coolify
    const coolifyResult = await this.coolify.listApplications();
    if (!coolifyResult.success) {
      issues.push(`Coolify: ${coolifyResult.error}`);
    }

    // Check Supabase
    const supabaseResult = await this.supabase.getVersion();
    if (!supabaseResult.success) {
      issues.push(`Supabase: ${supabaseResult.error}`);
    }

    const healthy = issues.length === 0;
    const message = healthy
      ? 'All critical services are healthy'
      : `Found ${issues.length} issue(s) with critical services`;

    return { healthy, message, issues };
  }
}

/**
 * Run startup health check and log results
 */
export async function runStartupHealthCheck(
  coolify: CoolifyClient,
  supabase: SupabaseManager,
  supabaseCLI: SupabaseCLI
): Promise<boolean> {
  console.error('\n🔍 Running startup health checks...\n');

  const checker = new HealthChecker(coolify, supabase, supabaseCLI);
  const quickResult = await checker.quickCheck();

  if (quickResult.healthy) {
    console.error('✅ All critical services are healthy\n');
    return true;
  } else {
    console.error('⚠️  Issues detected:\n');
    quickResult.issues.forEach(issue => {
      console.error(`   ❌ ${issue}`);
    });
    console.error('\n⚠️  Some services are not available. The server will start but some tools may not work.');
    console.error('   Run the "verify_setup" tool for detailed diagnostics.\n');
    return false;
  }
}

/**
 * Create a verification tool response
 */
export async function createVerificationReport(
  coolify: CoolifyClient,
  supabase: SupabaseManager,
  supabaseCLI: SupabaseCLI
): Promise<ToolResponse<SystemHealthReport>> {
  const checker = new HealthChecker(coolify, supabase, supabaseCLI);
  const report = await checker.checkAll();

  return {
    success: report.overall_status !== 'unhealthy',
    data: report,
    message: report.overall_status === 'healthy'
      ? 'All systems operational'
      : report.overall_status === 'degraded'
      ? 'Some services have warnings'
      : 'Critical services are unavailable',
  };
}

