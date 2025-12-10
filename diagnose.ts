#!/usr/bin/env node

/**
 * Diagnostic Tool for Supabase Coolify MCP Server
 * 
 * This script tests connectivity to Coolify and Supabase services
 * and provides detailed diagnostics to help troubleshoot connection issues.
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  details?: any;
  suggestion?: string;
}

class Diagnostics {
  private results: DiagnosticResult[] = [];

  constructor() {}

  log(color: keyof typeof colors, message: string) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  addResult(result: DiagnosticResult) {
    this.results.push(result);
  }

  printResult(result: DiagnosticResult) {
    const icon = {
      pass: '✅',
      fail: '❌',
      warning: '⚠️ ',
      skip: '⏭️ ',
    }[result.status];

    const color = {
      pass: 'green',
      fail: 'red',
      warning: 'yellow',
      skip: 'blue',
    }[result.status] as keyof typeof colors;

    this.log(color, `${icon} ${result.name}: ${result.message}`);
    
    if (result.details) {
      console.log('   Details:', result.details);
    }
    
    if (result.suggestion) {
      this.log('cyan', `   💡 Suggestion: ${result.suggestion}`);
    }
    console.log();
  }

  printSummary() {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    console.log('═'.repeat(70));
    this.log('bright', '\n📊 DIAGNOSTIC SUMMARY\n');
    this.log('green', `✅ Passed:   ${passed}`);
    this.log('red', `❌ Failed:   ${failed}`);
    this.log('yellow', `⚠️  Warnings: ${warnings}`);
    this.log('blue', `⏭️  Skipped:  ${this.results.filter(r => r.status === 'skip').length}`);
    console.log();

    if (failed > 0) {
      this.log('red', '🔴 CRITICAL ISSUES DETECTED - MCP Server will not work properly');
    } else if (warnings > 0) {
      this.log('yellow', '🟡 WARNING - MCP Server may have limited functionality');
    } else {
      this.log('green', '🟢 ALL CHECKS PASSED - MCP Server should work correctly');
    }
    console.log();
  }

  async run() {
    this.log('bright', '\n═══════════════════════════════════════════════════════════════════');
    this.log('cyan', '🔍 SUPABASE COOLIFY MCP SERVER DIAGNOSTICS');
    this.log('bright', '═══════════════════════════════════════════════════════════════════\n');

    // 1. Check .env file
    await this.checkEnvFile();

    // 2. Load environment variables
    dotenv.config();

    // 3. Check required environment variables
    await this.checkEnvironmentVariables();

    // 4. Test Coolify connection
    await this.testCoolifyConnection();

    // 5. Test Coolify authentication
    await this.testCoolifyAuthentication();

    // 6. Test Supabase connection
    await this.testSupabaseConnection();

    // 7. Test Supabase authentication
    await this.testSupabaseAuthentication();

    // 8. Test Supabase services
    await this.testSupabaseServices();

    // 9. Check network connectivity
    await this.checkNetworkConnectivity();

    // Print all results
    console.log('\n═══════════════════════════════════════════════════════════════════');
    this.log('bright', '📋 DETAILED RESULTS');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    this.results.forEach(result => this.printResult(result));

    // Print summary
    this.printSummary();
  }

  async checkEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), 'env.example');

    if (fs.existsSync(envPath)) {
      this.addResult({
        name: '.env File',
        status: 'pass',
        message: '.env file found',
        details: { path: envPath },
      });
    } else {
      this.addResult({
        name: '.env File',
        status: 'fail',
        message: '.env file not found',
        details: { 
          expected_path: envPath,
          example_exists: fs.existsSync(envExamplePath)
        },
        suggestion: fs.existsSync(envExamplePath)
          ? 'Copy env.example to .env: cp env.example .env'
          : 'Create a .env file with required environment variables',
      });
    }
  }

  async checkEnvironmentVariables() {
    const required = [
      { name: 'COOLIFY_API_URL', example: 'http://localhost:8000 or https://coolify.example.com' },
      { name: 'COOLIFY_API_TOKEN', example: 'clf_xxxxxxxxxxxxx (from Coolify dashboard)' },
      { name: 'SUPABASE_URL', example: 'https://your-project.supabase.co' },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', example: 'eyJhbGc... (service role key, not anon key)' },
    ];

    for (const env of required) {
      const value = process.env[env.name];
      
      if (!value) {
        this.addResult({
          name: `ENV: ${env.name}`,
          status: 'fail',
          message: 'Not set',
          details: { example: env.example },
          suggestion: `Add ${env.name} to your .env file`,
        });
      } else if (value.includes('your-') || value.includes('example') || value.includes('here')) {
        this.addResult({
          name: `ENV: ${env.name}`,
          status: 'fail',
          message: 'Contains placeholder value',
          details: { current_value: value.substring(0, 30) + '...' },
          suggestion: `Replace placeholder with actual value for ${env.name}`,
        });
      } else {
        const masked = this.maskSensitive(value);
        this.addResult({
          name: `ENV: ${env.name}`,
          status: 'pass',
          message: 'Set correctly',
          details: { value: masked },
        });
      }
    }
  }

  async testCoolifyConnection() {
    const apiUrl = process.env.COOLIFY_API_URL;
    
    if (!apiUrl) {
      this.addResult({
        name: 'Coolify Connection',
        status: 'skip',
        message: 'Skipped - COOLIFY_API_URL not set',
      });
      return;
    }

    try {
      const url = new URL(apiUrl);
      
      // Test basic connectivity
      const response = await axios.get(`${apiUrl}/api/v1/health`, {
        timeout: 10000,
        validateStatus: () => true, // Accept any status code
      });

      if (response.status === 200) {
        this.addResult({
          name: 'Coolify Connection',
          status: 'pass',
          message: 'Successfully connected to Coolify',
          details: {
            url: apiUrl,
            status: response.status,
            response_time: `${response.headers['x-response-time'] || 'N/A'}`,
          },
        });
      } else if (response.status === 401 || response.status === 403) {
        this.addResult({
          name: 'Coolify Connection',
          status: 'pass',
          message: 'Connected to Coolify (authentication will be tested separately)',
          details: { url: apiUrl, status: response.status },
        });
      } else if (response.status === 404) {
        this.addResult({
          name: 'Coolify Connection',
          status: 'warning',
          message: 'Connected but /health endpoint not found (may still work)',
          details: { url: apiUrl, status: response.status },
        });
      } else {
        this.addResult({
          name: 'Coolify Connection',
          status: 'warning',
          message: `Unexpected response: ${response.status}`,
          details: { url: apiUrl, status: response.status },
        });
      }
    } catch (error: any) {
      let suggestion = '';
      
      if (error.code === 'ECONNREFUSED') {
        suggestion = 'Check if Coolify is running and accessible at this URL';
      } else if (error.code === 'ENOTFOUND') {
        suggestion = 'Check if the hostname is correct and DNS is resolving';
      } else if (error.code === 'ETIMEDOUT') {
        suggestion = 'Check firewall settings and network connectivity';
      } else if (error.message.includes('certificate')) {
        suggestion = 'SSL certificate issue - check HTTPS configuration';
      }

      this.addResult({
        name: 'Coolify Connection',
        status: 'fail',
        message: 'Failed to connect',
        details: {
          url: apiUrl,
          error: error.message,
          code: error.code,
        },
        suggestion: suggestion || 'Verify COOLIFY_API_URL is correct and accessible',
      });
    }
  }

  async testCoolifyAuthentication() {
    const apiUrl = process.env.COOLIFY_API_URL;
    const apiToken = process.env.COOLIFY_API_TOKEN;
    
    if (!apiUrl || !apiToken) {
      this.addResult({
        name: 'Coolify Authentication',
        status: 'skip',
        message: 'Skipped - credentials not set',
      });
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/api/v1/applications`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      this.addResult({
        name: 'Coolify Authentication',
        status: 'pass',
        message: 'Successfully authenticated with Coolify',
        details: {
          applications_found: Array.isArray(response.data) ? response.data.length : 'N/A',
        },
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.addResult({
          name: 'Coolify Authentication',
          status: 'fail',
          message: 'Invalid API token',
          details: { status: 401 },
          suggestion: 'Generate a new API token from Coolify: Settings > API Tokens',
        });
      } else if (error.response?.status === 403) {
        this.addResult({
          name: 'Coolify Authentication',
          status: 'fail',
          message: 'API token lacks required permissions',
          details: { status: 403 },
          suggestion: 'Ensure the API token has sufficient permissions',
        });
      } else {
        this.addResult({
          name: 'Coolify Authentication',
          status: 'fail',
          message: 'Authentication test failed',
          details: {
            error: error.response?.data?.message || error.message,
            status: error.response?.status,
          },
          suggestion: 'Verify COOLIFY_API_TOKEN is correct',
        });
      }
    }
  }

  async testSupabaseConnection() {
    const supabaseUrl = process.env.SUPABASE_URL;
    
    if (!supabaseUrl) {
      this.addResult({
        name: 'Supabase Connection',
        status: 'skip',
        message: 'Skipped - SUPABASE_URL not set',
      });
      return;
    }

    try {
      const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status === 200 || response.status === 401) {
        this.addResult({
          name: 'Supabase Connection',
          status: 'pass',
          message: 'Successfully connected to Supabase',
          details: {
            url: supabaseUrl,
            status: response.status,
            version: response.headers['x-supabase-version'] || 'unknown',
          },
        });
      } else {
        this.addResult({
          name: 'Supabase Connection',
          status: 'warning',
          message: `Unexpected response: ${response.status}`,
          details: { url: supabaseUrl, status: response.status },
        });
      }
    } catch (error: any) {
      let suggestion = '';
      
      if (error.code === 'ECONNREFUSED') {
        suggestion = 'Check if Supabase is running and accessible';
      } else if (error.code === 'ENOTFOUND') {
        suggestion = 'Check if the Supabase URL is correct';
      } else if (error.code === 'ETIMEDOUT') {
        suggestion = 'Check firewall and network settings';
      }

      this.addResult({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Failed to connect',
        details: {
          url: supabaseUrl,
          error: error.message,
          code: error.code,
        },
        suggestion: suggestion || 'Verify SUPABASE_URL is correct',
      });
    }
  }

  async testSupabaseAuthentication() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      this.addResult({
        name: 'Supabase Authentication',
        status: 'skip',
        message: 'Skipped - credentials not set',
      });
      return;
    }

    try {
      const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Try to query a system table
      const { data, error } = await client
        .from('pg_tables')
        .select('schemaname')
        .limit(1);

      if (error) {
        if (error.message.includes('JWT') || error.message.includes('401')) {
          this.addResult({
            name: 'Supabase Authentication',
            status: 'fail',
            message: 'Invalid service role key',
            details: { error: error.message },
            suggestion: 'Verify SUPABASE_SERVICE_ROLE_KEY (not anon key!)',
          });
        } else {
          this.addResult({
            name: 'Supabase Authentication',
            status: 'warning',
            message: 'Auth successful but query failed',
            details: { error: error.message },
          });
        }
      } else {
        this.addResult({
          name: 'Supabase Authentication',
          status: 'pass',
          message: 'Successfully authenticated with Supabase',
          details: { can_query_database: true },
        });
      }
    } catch (error: any) {
      this.addResult({
        name: 'Supabase Authentication',
        status: 'fail',
        message: 'Authentication failed',
        details: { error: error.message },
        suggestion: 'Check SUPABASE_SERVICE_ROLE_KEY value',
      });
    }
  }

  async testSupabaseServices() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      this.addResult({
        name: 'Supabase Services',
        status: 'skip',
        message: 'Skipped - credentials not set',
      });
      return;
    }

    const services = [
      { name: 'REST API', endpoint: '/rest/v1/' },
      { name: 'Auth', endpoint: '/auth/v1/health' },
      { name: 'Storage', endpoint: '/storage/v1/healthcheck' },
      { name: 'Realtime', endpoint: '/realtime/v1/health' },
    ];

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await axios.get(`${supabaseUrl}${service.endpoint}`, {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
            },
            timeout: 5000,
            validateStatus: () => true,
          });

          return {
            service: service.name,
            status: response.status >= 200 && response.status < 400 ? 'healthy' : 'unhealthy',
            statusCode: response.status,
          };
        } catch {
          return {
            service: service.name,
            status: 'error',
            statusCode: null,
          };
        }
      })
    );

    const allHealthy = results.every(r => r.status === 'healthy');
    const anyHealthy = results.some(r => r.status === 'healthy');

    this.addResult({
      name: 'Supabase Services',
      status: allHealthy ? 'pass' : anyHealthy ? 'warning' : 'fail',
      message: allHealthy
        ? 'All services are healthy'
        : anyHealthy
        ? 'Some services are not responding'
        : 'No services are responding',
      details: results.reduce((acc, r) => {
        acc[r.service] = r.status === 'healthy' ? '✓' : '✗';
        return acc;
      }, {} as Record<string, string>),
    });
  }

  async checkNetworkConnectivity() {
    try {
      // Test general internet connectivity
      await axios.get('https://www.google.com', { timeout: 5000 });
      
      this.addResult({
        name: 'Network Connectivity',
        status: 'pass',
        message: 'Internet connection is working',
      });
    } catch {
      this.addResult({
        name: 'Network Connectivity',
        status: 'warning',
        message: 'Unable to verify internet connection',
        suggestion: 'Check your network connection',
      });
    }
  }

  maskSensitive(value: string): string {
    if (value.length <= 8) {
      return '***';
    }
    return value.substring(0, 8) + '...' + value.substring(value.length - 4);
  }
}

// Run diagnostics
const diagnostics = new Diagnostics();
diagnostics.run().catch(error => {
  console.error('Diagnostic script failed:', error);
  process.exit(1);
});

