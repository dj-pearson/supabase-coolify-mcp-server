# Supabase on Coolify - Complete Deployment Guide

This guide walks you through deploying a self-hosted Supabase instance on Coolify and managing it with the MCP server.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up Coolify](#setting-up-coolify)
3. [Deploying Supabase](#deploying-supabase)
4. [Configuring the MCP Server](#configuring-the-mcp-server)
5. [Common Operations](#common-operations)
6. [Best Practices](#best-practices)

## Prerequisites

### Required Services

- **Coolify Instance**: A running Coolify installation (v4.0+ recommended)
  - Self-hosted on your server, or
  - Coolify Cloud account

- **Domain Name** (Optional but recommended):
  - For accessing Supabase dashboard
  - For API endpoints
  - For edge functions

- **Node.js** >= 18.0.0 for the MCP server

### System Requirements

For a production Supabase deployment:
- Minimum 4GB RAM (8GB+ recommended)
- 20GB+ storage
- Ubuntu 20.04+ or similar Linux distribution

## Setting Up Coolify

### 1. Install Coolify (if self-hosting)

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Wait for installation to complete, then access Coolify at `http://your-server-ip:8000`

### 2. Initial Coolify Configuration

1. Create an account on first access
2. Add your server (if using remote servers)
3. Create a project for Supabase deployments

### 3. Generate API Token

1. Navigate to **Keys & Tokens** → **API Tokens**
2. Click **Create New Token**
3. Name: `Supabase MCP Server`
4. Permissions: Select `*` (full access) or minimum:
   - `read:applications`
   - `write:applications`
   - `read:services`
   - `write:services`
   - `read:databases`
   - `write:databases`
5. **Save the token securely** - you won't see it again!

## Deploying Supabase

### Method 1: Using the MCP Server (Recommended)

Once the MCP server is configured (see next section), you can deploy with a single command:

```typescript
deploy_supabase_to_coolify({
  name: "my-supabase",
  config: {
    postgres_version: "15",
    enable_realtime: true,
    enable_storage: true,
    enable_auth: true,
    enable_rest: true,
    enable_graphql: true,
    custom_domain: "https://supabase.yourdomain.com"
  }
})
```

The MCP server will:
- Create the Coolify application
- Configure all required services
- Set up secure passwords and JWT secrets
- Deploy the Supabase stack
- Return credentials (save these!)

### Method 2: Manual Coolify Deployment

#### Step 1: Create New Service

1. In Coolify, go to your project
2. Click **Add New Resource** → **Service**
3. Search for "Supabase" or use custom Docker Compose

#### Step 2: Configure Supabase Service

Use this Docker Compose configuration:

```yaml
version: '3.8'

services:
  postgres:
    image: supabase/postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: pg_isready -U postgres -h localhost
      interval: 5s
      timeout: 5s
      retries: 10

  studio:
    image: supabase/studio:latest
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      STUDIO_PG_META_URL: http://meta:8080
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
    depends_on:
      - postgres

  kong:
    image: supabase/kong:latest
    environment:
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
    depends_on:
      - postgres

  auth:
    image: supabase/gotrue:latest
    environment:
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  rest:
    image: postgrest/postgrest:latest
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
      PGRST_JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  realtime:
    image: supabase/realtime:latest
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: postgres
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  storage:
    image: supabase/storage-api:latest
    environment:
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
    depends_on:
      - postgres

  meta:
    image: supabase/postgres-meta:latest
    environment:
      PG_META_DB_HOST: postgres
      PG_META_DB_PORT: 5432
      PG_META_DB_USER: postgres
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      - postgres

volumes:
  postgres-data:
```

#### Step 3: Set Environment Variables

In Coolify, set these environment variables:

```env
POSTGRES_PASSWORD=<generate-secure-password>
JWT_SECRET=<generate-secure-secret-64-chars>
ANON_KEY=<generate-jwt-with-anon-role>
SERVICE_ROLE_KEY=<generate-jwt-with-service-role>
SITE_URL=https://your-app.com
SUPABASE_URL=https://supabase.your-domain.com
```

**Generate secure secrets:**

```bash
# PostgreSQL password (32 chars)
openssl rand -base64 32

# JWT secret (64 chars)
openssl rand -base64 64
```

**Generate JWT keys**: Use https://supabase.com/docs/guides/self-hosting#api-keys or the Supabase CLI.

#### Step 4: Configure Domain

1. In Coolify, add a domain for your Supabase instance
2. Enable SSL/TLS (recommended)
3. Configure DNS to point to your Coolify server

#### Step 5: Deploy

Click **Deploy** and wait for all services to start.

## Configuring the MCP Server

### 1. Install the MCP Server

```bash
npm install -g supabase-coolify-mcp-server
```

Or clone and build from source:

```bash
git clone <repository-url>
cd supabase-coolify-mcp-server
npm install
npm run build
```

### 2. Create Environment Configuration

Create a `.env` file:

```env
# Coolify Configuration
COOLIFY_API_URL=https://your-coolify-instance.com
COOLIFY_API_TOKEN=your-coolify-api-token

# Supabase Configuration
SUPABASE_URL=https://supabase.your-domain.com
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Direct Database Access
SUPABASE_DB_HOST=your-postgres-host
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-postgres-password
```

### 3. Configure Claude Desktop

**macOS**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: Edit `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["supabase-coolify-mcp-server", "--yes"],
      "env": {
        "COOLIFY_API_URL": "https://your-coolify-instance.com",
        "COOLIFY_API_TOKEN": "your-coolify-api-token",
        "SUPABASE_URL": "https://supabase.your-domain.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

## Common Operations

### Deploy a Database Migration

```typescript
deploy_migration({
  name: "create_profiles_table",
  sql: `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles FOR SELECT
      USING (true);

    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  `
})
```

### Deploy an Edge Function

```typescript
deploy_edge_function({
  name: "hello-world",
  code: `
    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

    serve(async (req) => {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        )

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(10)

        if (error) throw error

        return new Response(
          JSON.stringify({ data }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    })
  `,
  verify_jwt: true
})
```

### Create a Storage Bucket

```typescript
create_storage_bucket({
  id: "avatars",
  public: true,
  file_size_limit: 5242880 // 5MB
})
```

### Monitor Deployment Health

```typescript
// Check all services
check_supabase_health()

// Get deployment status
get_deployment_status({ uuid: "your-app-uuid" })

// View recent logs
get_coolify_logs({ uuid: "your-app-uuid", lines: 100 })
```

### Update Deployment Configuration

```typescript
update_supabase_deployment({
  uuid: "your-app-uuid",
  config: {
    enable_graphql: true,
    environment_variables: {
      "MAX_CONNECTIONS": "100"
    }
  }
})
```

## Best Practices

### Security

1. **Use Strong Passwords**
   - Minimum 32 characters for database passwords
   - Minimum 64 characters for JWT secrets

2. **Rotate Credentials Regularly**
   - API tokens every 90 days
   - JWT secrets annually or after security incidents

3. **Enable SSL/TLS**
   - Always use HTTPS for Supabase endpoints
   - Configure SSL in Coolify

4. **Restrict Network Access**
   - Use firewall rules
   - Limit API access to known IPs if possible

5. **Use Row Level Security (RLS)**
   - Enable RLS on all tables
   - Create specific policies for each use case

### Performance

1. **Database Optimization**
   - Create indexes for frequently queried columns
   - Use database connection pooling
   - Monitor query performance

2. **Resource Allocation**
   - Allocate sufficient RAM for PostgreSQL
   - Consider separate servers for production

3. **Caching**
   - Enable PostgREST caching
   - Use CDN for static assets

### Monitoring

1. **Set Up Alerts**
   - Monitor disk space
   - Track database connections
   - Watch for error rates

2. **Regular Health Checks**
   ```typescript
   // Schedule regular health checks
   check_supabase_health()
   ```

3. **Log Management**
   - Regularly review logs
   - Set up log rotation
   - Archive important logs

### Backup Strategy

1. **Database Backups**
   ```bash
   # Automated backup script
   pg_dump -h postgres-host -U postgres -d postgres > backup_$(date +%Y%m%d).sql
   ```

2. **Configuration Backups**
   - Save environment variables securely
   - Document custom configurations
   - Version control infrastructure code

3. **Test Restores**
   - Regularly test backup restoration
   - Document restore procedures

### Migration Best Practices

1. **Version Control**
   - Store migrations in Git
   - Use meaningful migration names
   - Include rollback scripts

2. **Testing**
   - Test migrations in development first
   - Use transactions when possible
   - Have a rollback plan

3. **Incremental Changes**
   - Make small, focused migrations
   - Avoid large schema changes in production
   - Plan for zero-downtime migrations

## Troubleshooting

### Service Won't Start

1. Check logs: `get_coolify_logs({ uuid: "app-uuid" })`
2. Verify environment variables are set correctly
3. Check database connectivity
4. Ensure sufficient resources (RAM, disk)

### Migration Failures

1. Review SQL syntax
2. Check for conflicting migrations
3. Verify database permissions
4. Test migration in development environment

### Edge Function Errors

1. Check function logs: `get_edge_function_logs({ name: "function-name" })`
2. Verify JWT configuration
3. Test function locally with Deno
4. Check environment variables

### Connection Issues

1. Verify DNS configuration
2. Check SSL certificates
3. Ensure firewall allows traffic
4. Test with `curl` or similar tools

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues specific to this MCP server:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [README.md](./README.md)

For Coolify support:
- [Coolify Discord](https://discord.gg/coolify)
- [Coolify GitHub](https://github.com/coollabsio/coolify)

For Supabase support:
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

