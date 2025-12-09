# Supabase Coolify MCP Server

A comprehensive TypeScript MCP (Model Context Protocol) server for managing self-hosted Supabase on Coolify. This server enables AI agents to fully deploy migrations, push edge functions, configure services, and manage Supabase deployments with ease.

## 🚀 Features

### Supabase Management
- **Database Migrations**: Deploy, track, rollback, and manage database migrations
- **Migration Rollback**: Safely rollback migrations with down SQL support
- **Supabase CLI Integration**: Full CLI integration for local development and deployment
- **Edge Functions**: Deploy, invoke, monitor, and delete edge functions
- **Storage Management**: Create and manage storage buckets
- **Auth Configuration**: Configure authentication providers and settings
- **Realtime Configuration**: Manage realtime service settings
- **Health Monitoring**: Check status of all Supabase services
- **Type Generation**: Generate TypeScript types from database schema

### Production Features
- **Input Validation**: Zod-based validation for all tool inputs
- **Health Checks**: Automatic startup checks and verification tool
- **Error Handling**: Comprehensive error messages with troubleshooting hints
- **Type Safety**: Full TypeScript support throughout

### Coolify Integration
- **Application Management**: List, deploy, start, stop, and restart applications
- **Service Management**: Control Coolify services
- **Database Management**: Manage Coolify-hosted databases
- **Environment Variables**: Update application configuration securely
- **Logs**: Access application logs for debugging

### Deployment Automation
- **One-Click Deployment**: Deploy complete Supabase instances on Coolify
- **Configuration Management**: Update deployment settings dynamically
- **Status Monitoring**: Track deployment health and status

## 📋 Prerequisites

- Node.js >= 18.0.0
- A Coolify instance (self-hosted or cloud)
- Coolify API token with appropriate permissions
- A self-hosted Supabase instance (or ready to deploy one)

## 🔧 Installation

### Method 1: NPM Package (Recommended)

```bash
npm install -g supabase-coolify-mcp-server
```

### Method 2: From Source

```bash
git clone <repository-url>
cd supabase-coolify-mcp-server
npm install
npm run build
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file or set the following environment variables:

```env
# Required: Coolify Configuration
COOLIFY_API_URL=http://localhost:8000
COOLIFY_API_TOKEN=your-coolify-api-token-here

# Required: Supabase Configuration
SUPABASE_URL=https://your-supabase-instance.example.com
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Coolify Team
COOLIFY_TEAM_ID=optional-team-id

# Optional: Supabase Additional Config
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_FUNCTIONS_URL=https://your-supabase-instance.example.com/functions/v1

# Optional: Direct Database Access
SUPABASE_DB_HOST=localhost
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-db-password
```

### Getting API Tokens

#### Coolify API Token

1. Log into your Coolify instance
2. Navigate to "Keys & Tokens" > "API tokens"
3. Click "Create New Token"
4. Select permissions (recommended: `*` for full access)
5. Copy the generated token

#### Supabase Service Role Key

For self-hosted Supabase:

1. Log into your Supabase dashboard
2. Go to Settings > API
3. Copy the `service_role` key (keep this secure!)

Or from your Supabase deployment environment variables:
```bash
echo $SERVICE_ROLE_KEY
```

## 🎯 Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "node",
      "args": ["/path/to/supabase-coolify-mcp-server/dist/index.js"],
      "env": {
        "COOLIFY_API_URL": "http://localhost:8000",
        "COOLIFY_API_TOKEN": "your-coolify-api-token",
        "SUPABASE_URL": "https://your-supabase-instance.example.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

#### Using NPX

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["supabase-coolify-mcp-server", "--yes"],
      "env": {
        "COOLIFY_API_URL": "http://localhost:8000",
        "COOLIFY_API_TOKEN": "your-coolify-api-token",
        "SUPABASE_URL": "https://your-supabase-instance.example.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Development Mode

```bash
# Using environment variables
export COOLIFY_API_URL="http://localhost:8000"
export COOLIFY_API_TOKEN="your-token"
export SUPABASE_URL="https://your-instance.example.com"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

npm run dev

# Or with .env file
npm run dev
```

### Running Built Version

```bash
npm run build
npm start
```

## 🛠️ Available Tools

### Database Migration Tools

#### `list_migrations`
List all database migrations with their status.

```typescript
// No parameters required
```

#### `deploy_migration`
Deploy a new database migration.

```typescript
{
  "sql": "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT);",
  "name": "create_users_table"
}
```

#### `execute_sql`
Execute raw SQL query on the Supabase database.

```typescript
{
  "sql": "SELECT * FROM users LIMIT 10;"
}
```

#### `get_migration_status`
Get status of a specific migration.

```typescript
{
  "version": "20231201120000"
}
```

### Edge Functions Tools

#### `list_edge_functions`
List all deployed edge functions.

#### `deploy_edge_function`
Deploy a new edge function.

```typescript
{
  "name": "hello-world",
  "code": "export default function handler(req) { return new Response('Hello World'); }",
  "verify_jwt": true
}
```

#### `delete_edge_function`
Delete an edge function.

```typescript
{
  "name": "hello-world"
}
```

#### `get_edge_function_logs`
Get logs for an edge function.

```typescript
{
  "name": "hello-world",
  "limit": 100
}
```

#### `invoke_edge_function`
Invoke an edge function.

```typescript
{
  "name": "hello-world",
  "payload": { "key": "value" }
}
```

### Storage Tools

#### `list_storage_buckets`
List all storage buckets.

#### `create_storage_bucket`
Create a new storage bucket.

```typescript
{
  "id": "avatars",
  "public": true,
  "file_size_limit": 5242880
}
```

#### `delete_storage_bucket`
Delete a storage bucket.

```typescript
{
  "id": "avatars"
}
```

### Auth & Configuration Tools

#### `get_auth_config`
Get authentication configuration.

#### `update_auth_config`
Update authentication configuration.

```typescript
{
  "config": {
    "site_url": "https://myapp.com",
    "enable_signup": true
  }
}
```

#### `check_supabase_health`
Check health of all Supabase services.

#### `get_supabase_version`
Get Supabase version information.

#### `verify_setup` ⭐
Verify system setup and check health of all services (Coolify, Supabase, CLI).

This comprehensive tool checks:
- Coolify connection and authentication
- Supabase connection and authentication
- Database accessibility
- CLI availability
- Response times and service status

**Returns:** Detailed health report with recommendations for any issues found.

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for complete verification guide.

### Coolify Management Tools

#### `list_coolify_applications`
List all Coolify applications.

#### `get_coolify_application`
Get details of a specific application.

```typescript
{
  "uuid": "app-uuid-here"
}
```

#### `update_coolify_application_env`
Update application environment variables.

```typescript
{
  "uuid": "app-uuid-here",
  "env": {
    "NODE_ENV": "production",
    "API_KEY": "secret"
  }
}
```

#### `deploy_coolify_application`
Deploy a Coolify application.

```typescript
{
  "uuid": "app-uuid-here"
}
```

#### `start_coolify_application` / `stop_coolify_application` / `restart_coolify_application`
Control application lifecycle.

```typescript
{
  "uuid": "app-uuid-here"
}
```

#### `get_coolify_logs`
Get application logs.

```typescript
{
  "uuid": "app-uuid-here",
  "lines": 100
}
```

### Deployment Tools

#### `deploy_supabase_to_coolify`
Deploy a complete Supabase instance on Coolify.

```typescript
{
  "name": "my-supabase",
  "config": {
    "postgres_version": "15",
    "enable_realtime": true,
    "enable_storage": true,
    "enable_auth": true,
    "custom_domain": "https://supabase.myapp.com",
    "environment_variables": {
      "CUSTOM_VAR": "value"
    }
  }
}
```

#### `update_supabase_deployment`
Update an existing Supabase deployment.

```typescript
{
  "uuid": "app-uuid-here",
  "config": {
    "enable_graphql": true
  }
}
```

#### `get_deployment_status`
Get status of a Supabase deployment.

```typescript
{
  "uuid": "app-uuid-here"
}
```

## 📚 MCP Resources

The server exposes these resources for MCP clients:

- `supabase://migrations` - All database migrations
- `supabase://edge-functions` - All edge functions
- `supabase://storage-buckets` - All storage buckets
- `supabase://auth-config` - Authentication configuration
- `supabase://health` - Service health status
- `coolify://applications` - All Coolify applications
- `coolify://services` - All Coolify services
- `coolify://databases` - All Coolify databases

## 🔒 Security Best Practices

1. **Never commit API tokens** to version control
2. **Use environment variables** for sensitive data
3. **Restrict API token permissions** to minimum required
4. **Rotate tokens regularly**
5. **Use service role key** only on secure servers
6. **Enable JWT verification** for edge functions
7. **Validate all inputs** (automatic with Zod schemas)
8. **Verify setup** before production deployments
9. **Set appropriate file permissions** on configuration files:

```bash
chmod 600 ~/.env
chmod 600 ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## 🧪 Testing & Verification

### Build and Type Check
```bash
# Run type checking
npm run typecheck

# Run linter
npm run lint

# Build project
npm run build
```

### Verify Setup
After starting the server, verify everything is working:

```bash
# Start the server
npm start

# Then ask Claude:
"Run verify_setup to check if everything is configured correctly"
```

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for complete verification guide.

## 🐛 Troubleshooting

### Common Issues

#### 1. Missing Environment Variables

**Error**: `Missing required environment variables: COOLIFY_API_URL, COOLIFY_API_TOKEN`

**Solution**: Ensure all required environment variables are set. Check your `.env` file or Claude Desktop configuration.

#### 2. Connection Failed

**Error**: `Failed to connect to Coolify API`

**Solution**:
- Verify Coolify instance is running
- Check API URL is correct (include `http://` or `https://`)
- Ensure API token has proper permissions
- Check network connectivity

#### 3. Authentication Failed

**Error**: `Unauthorized` or `401`

**Solution**:
- Verify API tokens are correct
- Check token hasn't expired
- Ensure token has required permissions

#### 4. MCP Server Not Appearing

**Solution**:
- Restart Claude Desktop
- Check configuration file path is correct for your OS
- Verify JSON syntax in configuration
- Check server logs for errors

### Debug Mode

Run with debug output:

```bash
DEBUG=* npm start
```

## 📖 Example Use Cases

### 1. Deploy a New Supabase Instance

```typescript
// Using the MCP tool
deploy_supabase_to_coolify({
  name: "production-supabase",
  config: {
    postgres_version: "15",
    enable_realtime: true,
    enable_storage: true,
    custom_domain: "https://api.myapp.com"
  }
})
```

### 2. Deploy Database Migration

```typescript
deploy_migration({
  name: "add_user_profiles",
  sql: `
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id),
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `
})
```

### 3. Deploy Edge Function

```typescript
deploy_edge_function({
  name: "send-email",
  code: `
    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
    
    serve(async (req) => {
      const { to, subject, body } = await req.json()
      // Send email logic here
      return new Response(JSON.stringify({ success: true }))
    })
  `,
  verify_jwt: true
})
```

### 4. Monitor Deployment Health

```typescript
// Check overall health
check_supabase_health()

// Get specific deployment status
get_deployment_status({ uuid: "your-app-uuid" })

// View logs
get_coolify_logs({ uuid: "your-app-uuid", lines: 100 })
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🔗 Related Projects

- [Coolify](https://coolify.io) - Self-hostable Heroku/Netlify alternative
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Model Context Protocol](https://github.com/modelcontextprotocol) - MCP specification

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the [troubleshooting section](#troubleshooting)
- Review Coolify and Supabase documentation

---

**Note**: This MCP server is designed for self-hosted Supabase instances on Coolify. It provides comprehensive management capabilities while maintaining security through environment variables and proper token handling.

