/**
 * Coolify API Client for managing applications and services
 */

import axios, { AxiosInstance } from 'axios';
import type {
  CoolifyConfig,
  CoolifyApplication,
  CoolifyDatabase,
  CoolifyService,
  ToolResponse,
} from './types.js';

export class CoolifyClient {
  private client: AxiosInstance;
  private config: CoolifyConfig;

  constructor(config: CoolifyConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List all applications
   */
  async listApplications(): Promise<ToolResponse<CoolifyApplication[]>> {
    try {
      const response = await this.client.get('/api/v1/applications');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to list applications');
    }
  }

  /**
   * Get application by UUID
   */
  async getApplication(uuid: string): Promise<ToolResponse<CoolifyApplication>> {
    try {
      const response = await this.client.get(`/api/v1/applications/${uuid}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, `Failed to get application ${uuid}`);
    }
  }

  /**
   * Create a new application
   */
  async createApplication(data: Partial<CoolifyApplication>): Promise<ToolResponse<CoolifyApplication>> {
    try {
      const response = await this.client.post('/api/v1/applications', data);
      return {
        success: true,
        data: response.data,
        message: 'Application created successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create application');
    }
  }

  /**
   * Update application environment variables
   */
  async updateApplicationEnv(uuid: string, env: Record<string, string>): Promise<ToolResponse<void>> {
    try {
      await this.client.patch(`/api/v1/applications/${uuid}/env`, { environment: env });
      return {
        success: true,
        message: 'Environment variables updated successfully',
      };
    } catch (error) {
      return this.handleError(error, `Failed to update environment variables for ${uuid}`);
    }
  }

  /**
   * Deploy an application
   */
  async deployApplication(uuid: string): Promise<ToolResponse<void>> {
    try {
      await this.client.post(`/api/v1/applications/${uuid}/deploy`);
      return {
        success: true,
        message: `Deployment started for application ${uuid}`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to deploy application ${uuid}`);
    }
  }

  /**
   * Start an application
   */
  async startApplication(uuid: string): Promise<ToolResponse<void>> {
    try {
      await this.client.post(`/api/v1/applications/${uuid}/start`);
      return {
        success: true,
        message: `Application ${uuid} started`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to start application ${uuid}`);
    }
  }

  /**
   * Stop an application
   */
  async stopApplication(uuid: string): Promise<ToolResponse<void>> {
    try {
      await this.client.post(`/api/v1/applications/${uuid}/stop`);
      return {
        success: true,
        message: `Application ${uuid} stopped`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to stop application ${uuid}`);
    }
  }

  /**
   * Restart an application
   */
  async restartApplication(uuid: string): Promise<ToolResponse<void>> {
    try {
      await this.client.post(`/api/v1/applications/${uuid}/restart`);
      return {
        success: true,
        message: `Application ${uuid} restarted`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to restart application ${uuid}`);
    }
  }

  /**
   * List all databases
   */
  async listDatabases(): Promise<ToolResponse<CoolifyDatabase[]>> {
    try {
      const response = await this.client.get('/api/v1/databases');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to list databases');
    }
  }

  /**
   * Get database by UUID
   */
  async getDatabase(uuid: string): Promise<ToolResponse<CoolifyDatabase>> {
    try {
      const response = await this.client.get(`/api/v1/databases/${uuid}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, `Failed to get database ${uuid}`);
    }
  }

  /**
   * List all services
   */
  async listServices(): Promise<ToolResponse<CoolifyService[]>> {
    try {
      const response = await this.client.get('/api/v1/services');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to list services');
    }
  }

  /**
   * Get service by UUID
   */
  async getService(uuid: string): Promise<ToolResponse<CoolifyService>> {
    try {
      const response = await this.client.get(`/api/v1/services/${uuid}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, `Failed to get service ${uuid}`);
    }
  }

  /**
   * Start a service
   */
  async startService(uuid: string): Promise<ToolResponse<void>> {
    try {
      await this.client.post(`/api/v1/services/${uuid}/start`);
      return {
        success: true,
        message: `Service ${uuid} started`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to start service ${uuid}`);
    }
  }

  /**
   * Stop a service
   */
  async stopService(uuid: string): Promise<ToolResponse<void>> {
    try {
      await this.client.post(`/api/v1/services/${uuid}/stop`);
      return {
        success: true,
        message: `Service ${uuid} stopped`,
      };
    } catch (error) {
      return this.handleError(error, `Failed to stop service ${uuid}`);
    }
  }

  /**
   * Get application logs
   */
  async getApplicationLogs(uuid: string, lines: number = 100): Promise<ToolResponse<string>> {
    try {
      const response = await this.client.get(`/api/v1/applications/${uuid}/logs`, {
        params: { lines },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error, `Failed to get logs for application ${uuid}`);
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

