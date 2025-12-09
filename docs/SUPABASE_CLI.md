# Supabase CLI Integration

Complete guide to using Supabase CLI tools through the MCP server.

## Overview

The MCP server now includes full Supabase CLI integration, allowing you to use the Supabase CLI directly through natural language with AI agents.

## Prerequisites

### Installing Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

Or check via MCP:
```typescript
check_cli_installed()
// Returns: { installed: true, version: "1.x.x" }
```

## Available CLI Tools

### Project Setup

#### `check_cli_installed`
Check if Supabase CLI is installed and get the version.

```typescript
// Example usage with Claude
"Is the Supabase CLI installed?"

// Returns
{
  "installed": true,
  "version": "1.123.4"
}
```

#### `supabase_init`
Initialize a new Supabase project.

```typescript
// Example
"Initialize a new Supabase project in the current directory"

supabase_init({ path: '.' })
```

#### `supabase_link`
Link your local project to a remote Supabase project.

```typescript
// Example
"Link to my Supabase project abc123xyz"

supabase_link({
  project_ref: "abc123xyz",
  password: "optional-db-password"
})
```

### Local Development

#### `supabase_start`
Start the local Supabase development environment.

```typescript
// Example
"Start the local Supabase environment"

supabase_start()
```

This starts all Supabase services locally:
- PostgreSQL database
- Auth server
- Storage server
- Realtime server
- PostgREST API
- Studio UI

#### `supabase_stop`
Stop the local Supabase environment.

```typescript
// Example
"Stop the local Supabase services"

supabase_stop()
```

#### `supabase_status`
Get the status of all local services.

```typescript
// Example
"What's the status of my local Supabase?"

supabase_status()
```

Returns URLs and status for:
- API URL
- Studio URL
- Inbucket URL
- JWT secret
- Anon key
- Service role key

### Database Operations

#### `supabase_db_diff`
Generate a migration file from schema changes.

```typescript
// Example
"Generate a migration for my database changes called add_timestamps"

supabase_db_diff({ name: "add_timestamps" })
```

This creates a new migration file in `supabase/migrations/` with the SQL needed to replicate your schema changes.

#### `supabase_db_push`
Push local migrations to the remote database.

```typescript
// Example
"Push my local migrations to production"

supabase_db_push()
```

⚠️ **Warning**: This applies all pending migrations to your remote database. Use with caution in production.

#### `supabase_db_reset`
Reset the local database to a clean state.

```typescript
// Example
"Reset my local database"

supabase_db_reset()
```

This:
1. Drops all tables
2. Re-runs all migrations from scratch
3. Reseeds data if configured

### Migration Management

#### `supabase_migration_new`
Create a new empty migration file.

```typescript
// Example
"Create a new migration file called add_user_roles"

supabase_migration_new({ name: "add_user_roles" })
```

Creates: `supabase/migrations/{timestamp}_add_user_roles.sql`

#### `supabase_migration_list`
List all migrations and their status.

```typescript
// Example
"Show me all my migrations"

supabase_migration_list()
```

Shows:
- Migration version
- Name
- Applied status
- Timestamp

#### `supabase_migration_repair`
Repair migration history if it gets out of sync.

```typescript
// Example
"Repair my migration history"

supabase_migration_repair()
```

Useful when:
- Migrations were manually applied
- Migration history is inconsistent
- Moving between environments

### Edge Functions

#### `supabase_functions_deploy`
Deploy edge functions to your remote project.

```typescript
// Example - deploy specific function
"Deploy my hello-world edge function"

supabase_functions_deploy({ function_name: "hello-world" })

// Example - deploy all functions
"Deploy all my edge functions"

supabase_functions_deploy()
```

#### `supabase_functions_serve`
Serve edge functions locally for development.

```typescript
// Example
"Start serving my edge functions locally"

supabase_functions_serve()

// Or specific function
supabase_functions_serve({ function_name: "my-function" })
```

Access at: `http://localhost:54321/functions/v1/your-function`

### Code Generation

#### `supabase_gen_types`
Generate TypeScript types from your database schema.

```typescript
// Example
"Generate TypeScript types from my database"

supabase_gen_types({ output: "types/database.ts" })
```

This creates a fully-typed interface for your database, including:
- Table definitions
- Column types
- Relationships
- RLS policies

Example output:
```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}
```

### Advanced

#### `supabase_cli_execute`
Execute any Supabase CLI command.

```typescript
// Example
"Run supabase db branches list"

supabase_cli_execute({ command: "db branches list" })
```

⚠️ **Note**: The command should NOT include the `supabase` prefix.

## Complete Workflow Example

### Setting Up a New Project

```typescript
// 1. Check CLI is installed
"Is Supabase CLI installed?"
→ check_cli_installed()

// 2. Initialize project
"Initialize a new Supabase project"
→ supabase_init()

// 3. Link to remote
"Link to my project ref abc123"
→ supabase_link({ project_ref: "abc123" })

// 4. Start local development
"Start local Supabase"
→ supabase_start()

// 5. Check status
"What's my local Supabase status?"
→ supabase_status()
```

### Development Workflow

```typescript
// 1. Make schema changes in Studio or SQL
// (Access Studio at http://localhost:54321)

// 2. Generate migration
"Generate a migration called add_profiles_table"
→ supabase_db_diff({ name: "add_profiles_table" })

// 3. Review the generated SQL
"Show me the migration file"

// 4. Test locally
"Reset my local database to test from scratch"
→ supabase_db_reset()

// 5. Deploy to production
"Push migrations to production"
→ supabase_db_push()
```

### Edge Functions Workflow

```typescript
// 1. Create function files locally
// (Create in supabase/functions/my-function/index.ts)

// 2. Test locally
"Serve my edge functions locally"
→ supabase_functions_serve()

// 3. Deploy to production
"Deploy my-function to production"
→ supabase_functions_deploy({ function_name: "my-function" })
```

### Type Generation Workflow

```typescript
// 1. After schema changes
"Generate TypeScript types"
→ supabase_gen_types({ output: "types/supabase.ts" })

// 2. Use in your application
import { Database } from './types/supabase'

const client = createClient<Database>(url, key)
```

## Best Practices

### 1. Always Use Version Control

```bash
# Your migrations are in supabase/migrations/
git add supabase/migrations/
git commit -m "Add user profiles table"
```

### 2. Test Locally First

```typescript
// Always test migrations locally
supabase_db_reset()  // Clean slate
// Test your app
supabase_db_push()   // Then push to production
```

### 3. Use Type Generation

```typescript
// After any schema changes
supabase_gen_types()
// Commit the types file
```

### 4. Keep Migrations Small

```typescript
// ✅ Good - focused migration
supabase_migration_new({ name: "add_email_to_profiles" })

// ❌ Bad - too broad
supabase_migration_new({ name: "update_everything" })
```

### 5. Use Descriptive Names

```typescript
// ✅ Good
supabase_migration_new({ name: "add_user_authentication" })
supabase_migration_new({ name: "create_posts_table" })

// ❌ Bad
supabase_migration_new({ name: "migration1" })
supabase_migration_new({ name: "fix" })
```

## Troubleshooting

### CLI Not Found

**Error**: `supabase: command not found`

**Solution**:
```bash
npm install -g supabase
```

### Not Linked to Project

**Error**: `No project ref detected`

**Solution**:
```typescript
supabase_link({ project_ref: "your-project-ref" })
```

### Services Not Starting

**Error**: `Error starting services`

**Solution**:
```typescript
// Stop everything first
supabase_stop()

// Start fresh
supabase_start()
```

### Migration Conflicts

**Error**: `Migration already exists`

**Solution**:
```typescript
// Repair migration history
supabase_migration_repair()
```

### Port Already in Use

**Error**: `Port 54321 already in use`

**Solution**:
```bash
# Stop any running Supabase instances
supabase stop

# Or kill the process using the port
lsof -ti:54321 | xargs kill
```

## Environment Variables

The CLI tools use these optional environment variables:

```env
# Optional: For authenticated operations
SUPABASE_ACCESS_TOKEN=your-access-token

# Optional: For remote operations
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_DB_URL=your-db-url
```

## Integration with Other Tools

### With Regular MCP Tools

You can mix CLI tools with regular MCP tools:

```typescript
// Use CLI to generate migration
supabase_db_diff({ name: "new_migration" })

// Use MCP tool to deploy it
deploy_migration({
  name: "new_migration",
  sql: "-- migration content --"
})
```

### With Coolify

```typescript
// Deploy Supabase on Coolify
deploy_supabase_to_coolify({ name: "production" })

// Link CLI to remote
supabase_link({ project_ref: "production-ref" })

// Push migrations
supabase_db_push()
```

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase CLI GitHub](https://github.com/supabase/cli)
- [Migration Guide](https://supabase.com/docs/guides/cli/managing-migrations)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)

---

**Next Steps**: Check out [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md) for rollback functionality.

