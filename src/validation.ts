/**
 * Input validation schemas using Zod
 * Ensures all tool inputs are validated before execution
 */

import { z } from 'zod';

// ==================== Common Schemas ====================

const uuidSchema = z.string().uuid('Invalid UUID format');
const versionSchema = z.string().regex(/^\d{14}$/, 'Version must be 14 digits (YYYYMMDDHHMMSS)');
const nameSchema = z.string().min(1, 'Name cannot be empty').max(100, 'Name too long');
const sqlSchema = z.string().min(1, 'SQL cannot be empty');
const urlSchema = z.string().url('Invalid URL format');

// ==================== Migration Schemas ====================

export const deployMigrationSchema = z.object({
  sql: sqlSchema,
  name: nameSchema,
});

export const createMigrationWithRollbackSchema = z.object({
  name: nameSchema,
  up_sql: sqlSchema,
  down_sql: sqlSchema,
});

export const rollbackMigrationSchema = z.object({
  version: versionSchema,
  down_sql: sqlSchema.optional(),
});

export const rollbackToVersionSchema = z.object({
  version: versionSchema,
});

export const rollbackLastMigrationsSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
});

export const getMigrationStatusSchema = z.object({
  version: versionSchema,
});

export const executeSQLSchema = z.object({
  sql: sqlSchema,
});

// ==================== Edge Function Schemas ====================

export const deployEdgeFunctionSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Function name must be lowercase alphanumeric with hyphens'),
  code: z.string().min(1, 'Function code cannot be empty'),
  verify_jwt: z.boolean().default(true),
});

export const deleteEdgeFunctionSchema = z.object({
  name: z.string().min(1),
});

export const getEdgeFunctionLogsSchema = z.object({
  name: z.string().min(1),
  limit: z.number().int().min(1).max(1000).default(100),
});

export const invokeEdgeFunctionSchema = z.object({
  name: z.string().min(1),
  payload: z.any().optional(),
});

// ==================== Storage Schemas ====================

export const createStorageBucketSchema = z.object({
  id: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/, 'Bucket ID must be lowercase alphanumeric with hyphens'),
  public: z.boolean().default(false),
  file_size_limit: z.number().int().min(0).optional(),
});

export const deleteStorageBucketSchema = z.object({
  id: z.string().min(1),
});

// ==================== Auth Schemas ====================

export const updateAuthConfigSchema = z.object({
  config: z.object({
    site_url: urlSchema.optional(),
    jwt_secret: z.string().min(32).optional(),
    jwt_expiry: z.number().int().min(60).optional(),
    enable_signup: z.boolean().optional(),
  }).passthrough(), // Allow additional fields
});

// ==================== Coolify Schemas ====================

export const getCoolifyApplicationSchema = z.object({
  uuid: uuidSchema,
});

export const updateCoolifyApplicationEnvSchema = z.object({
  uuid: uuidSchema,
  env: z.record(z.string(), z.string()),
});

export const deployCoolifyApplicationSchema = z.object({
  uuid: uuidSchema,
});

export const coolifyApplicationActionSchema = z.object({
  uuid: uuidSchema,
});

export const getCoolifyLogsSchema = z.object({
  uuid: uuidSchema,
  lines: z.number().int().min(1).max(10000).default(100),
});

// ==================== Supabase CLI Schemas ====================

export const supabaseInitSchema = z.object({
  path: z.string().default('.'),
});

export const supabaseLinkSchema = z.object({
  project_ref: z.string().min(1),
  password: z.string().optional(),
});

export const supabaseDbDiffSchema = z.object({
  name: nameSchema,
});

export const supabaseMigrationNewSchema = z.object({
  name: nameSchema,
});

export const supabaseFunctionsDeploySchema = z.object({
  function_name: z.string().optional(),
});

export const supabaseGenTypesSchema = z.object({
  output: z.string().default('types/supabase.ts'),
});

export const supabaseCLIExecuteSchema = z.object({
  command: z.string().min(1),
});

// ==================== Deployment Schemas ====================

export const deploySupabaseToCoolifySchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Name must be lowercase alphanumeric with hyphens'),
  config: z.object({
    postgres_version: z.string().default('15'),
    enable_realtime: z.boolean().default(true),
    enable_storage: z.boolean().default(true),
    enable_auth: z.boolean().default(true),
    enable_rest: z.boolean().default(true),
    enable_graphql: z.boolean().default(false),
    custom_domain: urlSchema.optional(),
    environment_variables: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

export const updateSupabaseDeploymentSchema = z.object({
  uuid: uuidSchema,
  config: z.object({
    postgres_version: z.string().optional(),
    enable_realtime: z.boolean().optional(),
    enable_storage: z.boolean().optional(),
    enable_auth: z.boolean().optional(),
    enable_rest: z.boolean().optional(),
    enable_graphql: z.boolean().optional(),
    custom_domain: urlSchema.optional(),
    environment_variables: z.record(z.string(), z.string()).optional(),
  }),
});

export const getDeploymentStatusSchema = z.object({
  uuid: uuidSchema,
});

// ==================== Validation Helper ====================

/**
 * Validate input against a Zod schema
 * Returns validated data or throws with helpful error message
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }
    throw error;
  }
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: `Validation failed: ${errors}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

