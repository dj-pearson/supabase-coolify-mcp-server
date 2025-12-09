# Architecture Documentation

This document explains the architecture and design decisions of the Supabase Coolify MCP Server.

## 🏗️ System Overview

The Supabase Coolify MCP Server bridges three systems:

1. **Coolify** - Self-hosted deployment platform
2. **Supabase** - Self-hosted backend-as-a-service
3. **MCP Clients** (e.g., Claude Desktop) - AI agents that use the MCP protocol

```
┌─────────────────┐
│   MCP Client    │  (Claude Desktop, etc.)
│  (AI Agent)     │
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────────────────────────────┐
│    Supabase Coolify MCP Server          │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │   Coolify    │  │    Supabase     │ │
│  │    Client    │  │    Manager      │ │
│  └──────┬───────┘  └────────┬────────┘ │
│         │                   │          │
└─────────┼───────────────────┼──────────┘
          │                   │
          │ REST API          │ REST API / SQL
          │                   │
┌─────────▼───────┐  ┌────────▼─────────┐
│     Coolify     │  │     Supabase     │
│    Instance     │  │    Instance      │
└─────────────────┘  └──────────────────┘
```

## 📦 Component Architecture

### 1. MCP Server (index.ts)

The main server that:
- Initializes the MCP protocol connection
- Registers all tools and resources
- Handles tool execution requests
- Manages error handling and responses

**Key responsibilities:**
- Validate environment variables
- Set up MCP protocol handlers
- Route tool calls to appropriate handlers
- Format responses for MCP clients

### 2. Coolify Client (coolify-client.ts)

Handles all interactions with the Coolify API:

```typescript
class CoolifyClient {
  - listApplications()
  - getApplication(uuid)
  - createApplication(data)
  - deployApplication(uuid)
  - updateApplicationEnv(uuid, env)
  - listServices()
  - listDatabases()
  - getApplicationLogs(uuid)
}
```

**Features:**
- Axios-based HTTP client
- Automatic error handling
- Bearer token authentication
- Typed responses

### 3. Supabase Manager (supabase-client.ts)

Manages self-hosted Supabase instances:

```typescript
class SupabaseManager {
  // Database Migrations
  - listMigrations()
  - deployMigration(sql, name)
  - executeSQL(sql)
  
  // Edge Functions
  - listEdgeFunctions()
  - deployEdgeFunction(name, code, verifyJWT)
  - deleteEdgeFunction(name)
  - invokeEdgeFunction(name, payload)
  
  // Storage
  - listStorageBuckets()
  - createStorageBucket(id, isPublic, sizeLimit)
  - deleteStorageBucket(id)
  
  // Auth & Config
  - getAuthConfig()
  - updateAuthConfig(config)
  
  // Health & Status
  - checkHealth()
  - getVersion()
}
```

**Features:**
- Supabase JS client integration
- Direct API calls for admin operations
- Comprehensive error handling
- Health monitoring

### 4. Tool Handlers

#### Supabase Tools (tools/supabase-tools.ts)

Registers tools for Supabase operations:
- Migration management
- Edge function deployment
- Storage operations
- Authentication configuration
- Health monitoring

#### Coolify Tools (tools/coolify-tools.ts)

Registers tools for Coolify operations:
- Application management
- Service control
- Environment configuration
- Log access

#### Deployment Tools (tools/deployment-tools.ts)

Registers high-level deployment tools:
- One-click Supabase deployment
- Configuration updates
- Status monitoring

### 5. Resources (resources.ts)

Exposes read-only resources via MCP:
- `supabase://migrations` - All migrations
- `supabase://edge-functions` - All functions
- `supabase://storage-buckets` - All buckets
- `coolify://applications` - All apps
- `coolify://services` - All services

## 🔄 Data Flow

### Tool Execution Flow

```
1. AI Agent requests tool execution
   ↓
2. MCP Server receives request via stdio
   ↓
3. Server validates request and parameters
   ↓
4. Server looks up tool handler
   ↓
5. Handler calls appropriate client method
   ↓
6. Client makes API request to Coolify/Supabase
   ↓
7. Response is formatted and returned
   ↓
8. MCP Server sends response to AI Agent
```

### Example: Deploy Migration

```typescript
// 1. AI Agent calls tool
deploy_migration({
  name: "create_users",
  sql: "CREATE TABLE users (...);"
})

// 2. MCP Server receives request
CallToolRequestSchema → request handler

// 3. Route to handler
toolHandlers.get('deploy_migration')

// 4. Execute via Supabase Manager
supabaseManager.deployMigration(sql, name)

// 5. Execute SQL on Supabase
POST /rest/v1/rpc/exec_sql

// 6. Return formatted response
{
  success: true,
  data: { version: "...", name: "...", status: "applied" },
  message: "Migration deployed successfully"
}
```

## 🔐 Security Architecture

### Authentication Flow

```
Environment Variables
  ↓
  ├─→ COOLIFY_API_TOKEN → Coolify Client → Bearer Auth
  └─→ SUPABASE_SERVICE_ROLE_KEY → Supabase Manager → JWT Auth
```

### Security Layers

1. **Environment Variable Protection**
   - All secrets stored in environment variables
   - Never committed to version control
   - Validated on server startup

2. **API Token Security**
   - Bearer token authentication for Coolify
   - Service role key for Supabase (admin access)
   - Scoped permissions on Coolify API tokens

3. **Network Security**
   - HTTPS for all API communications
   - JWT verification for edge functions
   - Row Level Security (RLS) in database

4. **Error Handling**
   - Sensitive data not exposed in errors
   - Structured error responses
   - Logging without secrets

## 🔧 Type System

### Core Types (types.ts)

```typescript
// Configuration Types
CoolifyConfig
SupabaseConfig
SupabaseDatabaseConfig

// Entity Types
CoolifyApplication
CoolifyDatabase
CoolifyService
Migration
EdgeFunction
StorageBucket

// Response Types
ToolResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

### Type Safety Benefits

- Compile-time error detection
- Auto-completion in IDEs
- Self-documenting code
- Easier refactoring

## 📡 MCP Protocol Integration

### Protocol Features Used

1. **Tools** - Executable operations
   ```typescript
   ListToolsRequestSchema → returns available tools
   CallToolRequestSchema → executes a tool
   ```

2. **Resources** - Read-only data access
   ```typescript
   ListResourcesRequestSchema → lists available resources
   ReadResourceRequestSchema → reads a resource
   ```

3. **Transport** - stdio communication
   ```typescript
   StdioServerTransport → communicates via stdin/stdout
   ```

### Request/Response Format

**Tool Call Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "deploy_migration",
    "arguments": {
      "sql": "CREATE TABLE...",
      "name": "create_users"
    }
  }
}
```

**Tool Call Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\": true, \"data\": {...}}"
    }
  ]
}
```

## 🎯 Design Decisions

### 1. Separation of Concerns

**Decision:** Split into distinct clients (Coolify, Supabase) rather than one monolithic class.

**Rationale:**
- Easier to maintain and test
- Clear boundaries of responsibility
- Reusable components
- Better code organization

### 2. Unified Response Format

**Decision:** All tool responses use `ToolResponse<T>` type.

**Rationale:**
- Consistent error handling
- Predictable for AI agents
- Easy to extend with additional fields
- Type-safe data access

### 3. Environment-Based Configuration

**Decision:** Use environment variables instead of config files.

**Rationale:**
- Follows 12-factor app principles
- Easier secret management
- Compatible with deployment platforms
- No risk of committing secrets

### 4. TypeScript + ES Modules

**Decision:** Use TypeScript with ES modules (not CommonJS).

**Rationale:**
- Better type safety
- Modern JavaScript features
- Tree-shaking support
- Future-proof

### 5. Comprehensive Error Handling

**Decision:** Every API call wrapped in try-catch with structured errors.

**Rationale:**
- Graceful degradation
- Clear error messages for AI agents
- Easier debugging
- Better user experience

## 🔄 Extension Points

### Adding New Supabase Tools

1. Add method to `SupabaseManager` class
2. Register tool in `tools/supabase-tools.ts`
3. Add metadata in `index.ts` tool descriptions
4. Update types if needed

Example:
```typescript
// 1. Add to SupabaseManager
async getTableInfo(tableName: string): Promise<ToolResponse<TableInfo>> {
  // Implementation
}

// 2. Register in supabase-tools.ts
toolHandlers.set('get_table_info', async (args: { table: string }) => {
  return await supabase.getTableInfo(args.table);
});

// 3. Add metadata in index.ts
get_table_info: {
  name: 'get_table_info',
  description: 'Get information about a database table',
  inputSchema: {
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name' }
    },
    required: ['table']
  }
}
```

### Adding New Coolify Tools

Follow the same pattern as Supabase tools but in the Coolify client and tools files.

### Adding New Resources

1. Add resource definition in `registerResources()`
2. Add handler for reading the resource
3. Document in README

## 🧪 Testing Strategy

### Current Testing

- TypeScript compilation
- ESLint code quality checks
- Manual integration testing

### Recommended Future Testing

1. **Unit Tests**
   - Test individual client methods
   - Mock API responses
   - Test error handling

2. **Integration Tests**
   - Test with actual Coolify instance
   - Test with Supabase instance
   - End-to-end tool execution

3. **Type Tests**
   - Verify type definitions
   - Test type inference

## 📊 Performance Considerations

### Current Optimizations

- Single persistent connections to APIs
- Minimal data transformation
- Efficient error handling

### Future Optimizations

- Response caching for read-heavy operations
- Batch operations for multiple tool calls
- Connection pooling for database
- Rate limiting and throttling

## 🔍 Monitoring & Observability

### Built-in Monitoring

- Health check tools
- Log access tools
- Version information
- Status monitoring

### Recommended Additions

- Structured logging
- Metrics collection
- Performance tracking
- Error rate monitoring
- Usage analytics

## 📚 Related Documentation

- [README.md](./README.md) - User guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [examples/](./examples/) - Usage examples

## 🤝 Contributing Architecture Improvements

When proposing architectural changes:

1. **Document the problem** - What limitation are you addressing?
2. **Propose the solution** - How does your change improve the architecture?
3. **Consider backwards compatibility** - Will existing deployments break?
4. **Update documentation** - Keep architecture docs in sync
5. **Provide examples** - Show how to use the new features

---

For questions about architecture:
- Open a GitHub issue with the "architecture" label
- Reference this document in discussions
- Propose changes via pull requests

