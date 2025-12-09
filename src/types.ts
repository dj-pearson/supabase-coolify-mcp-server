/**
 * Type definitions for Supabase Coolify MCP Server
 */

// Coolify Types
export interface CoolifyConfig {
  apiUrl: string;
  apiToken: string;
  teamId?: string;
}

export interface CoolifyApplication {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  fqdn?: string;
  status: string;
  build_pack?: string;
  git_repository?: string;
  git_branch?: string;
  environment?: Record<string, string>;
}

export interface CoolifyDatabase {
  id: string;
  uuid: string;
  name: string;
  type: string;
  status: string;
  version?: string;
  internal_db_url?: string;
  public_port?: number;
}

export interface CoolifyService {
  id: string;
  uuid: string;
  name: string;
  type: string;
  status: string;
  services?: CoolifyServiceComponent[];
}

export interface CoolifyServiceComponent {
  name: string;
  image: string;
  status: string;
  ports?: number[];
}

// Supabase Types
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  projectId?: string;
  projectRef?: string;
  functionsUrl?: string;
}

export interface SupabaseDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface Migration {
  version: string;
  name: string;
  executed_at?: string;
  status: 'pending' | 'applied' | 'failed';
  sql?: string;
}

export interface EdgeFunction {
  name: string;
  id?: string;
  version?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  verify_jwt?: boolean;
}

export interface EdgeFunctionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  function_name: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  created_at: string;
  updated_at: string;
}

export interface SupabaseAuthConfig {
  site_url?: string;
  jwt_secret?: string;
  jwt_expiry?: number;
  enable_signup?: boolean;
  providers?: AuthProvider[];
}

export interface AuthProvider {
  name: string;
  enabled: boolean;
  client_id?: string;
  client_secret?: string;
}

export interface RealtimeConfig {
  enabled: boolean;
  max_connections?: number;
  max_channels_per_client?: number;
}

export interface SupabaseServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  version?: string;
  uptime?: number;
}

// MCP Tool Response Types
export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Deployment Configuration
export interface SupabaseDeploymentConfig {
  postgres_version?: string;
  enable_realtime?: boolean;
  enable_storage?: boolean;
  enable_auth?: boolean;
  enable_rest?: boolean;
  enable_graphql?: boolean;
  custom_domain?: string;
  environment_variables?: Record<string, string>;
}

// Health Check Types
export interface HealthCheck {
  service: string;
  healthy: boolean;
  message?: string;
  timestamp: string;
}

