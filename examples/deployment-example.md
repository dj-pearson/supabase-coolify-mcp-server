# Complete Deployment Example

This example demonstrates a complete workflow for deploying and managing Supabase on Coolify using the MCP server.

## Step 1: Initial Deployment

Deploy a new Supabase instance:

```typescript
// Deploy Supabase to Coolify
const deployment = await deploy_supabase_to_coolify({
  name: "production-supabase",
  config: {
    postgres_version: "15",
    enable_realtime: true,
    enable_storage: true,
    enable_auth: true,
    enable_rest: true,
    enable_graphql: true,
    custom_domain: "https://api.myapp.com",
    environment_variables: {
      // Custom configuration
      "POSTGRES_MAX_CONNECTIONS": "100",
      "POSTGRES_SHARED_BUFFERS": "256MB"
    }
  }
})

// Save the credentials securely!
console.log("Deployment UUID:", deployment.data.uuid)
console.log("Credentials:", deployment.data.credentials)
```

**Important**: Save the credentials returned by the deployment. You'll need them to configure your MCP server and applications.

## Step 2: Configure Environment Variables

Update your `.env` file with the deployment information:

```env
COOLIFY_API_URL=https://your-coolify.com
COOLIFY_API_TOKEN=your-coolify-token

SUPABASE_URL=https://api.myapp.com
SUPABASE_ANON_KEY=<anon_key from deployment>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key from deployment>
```

## Step 3: Check Deployment Status

Verify that all services are running:

```typescript
// Check health of all services
const health = await check_supabase_health()
console.log("Service Health:", health.data)

// Get detailed deployment status
const status = await get_deployment_status({
  uuid: deployment.data.uuid
})
console.log("Deployment Status:", status.data)
```

## Step 4: Deploy Database Schema

Create your initial database schema with migrations:

```typescript
// Create profiles table
await deploy_migration({
  name: "create_profiles_table",
  sql: `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public profiles are viewable"
      ON public.profiles FOR SELECT
      USING (true);

    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  `
})

// Create posts table
await deploy_migration({
  name: "create_posts_table",
  sql: `
    CREATE TABLE IF NOT EXISTS public.posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT,
      published BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Published posts are viewable"
      ON public.posts FOR SELECT
      USING (published = true OR auth.uid() = user_id);

    CREATE POLICY "Users can create their own posts"
      ON public.posts FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own posts"
      ON public.posts FOR UPDATE
      USING (auth.uid() = user_id);
  `
})

// Verify migrations
const migrations = await list_migrations()
console.log("Applied migrations:", migrations.data)
```

## Step 5: Create Storage Buckets

Set up storage buckets for file uploads:

```typescript
// Create avatars bucket (public)
await create_storage_bucket({
  id: "avatars",
  public: true,
  file_size_limit: 2097152 // 2MB
})

// Create documents bucket (private)
await create_storage_bucket({
  id: "documents",
  public: false,
  file_size_limit: 10485760 // 10MB
})

// Verify buckets
const buckets = await list_storage_buckets()
console.log("Storage buckets:", buckets.data)
```

## Step 6: Deploy Edge Functions

Deploy serverless functions:

```typescript
// Deploy email notification function
await deploy_edge_function({
  name: "send-notification",
  code: `
    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

    serve(async (req) => {
      try {
        const { userId, message } = await req.json()
        
        // Your email logic here
        console.log(\`Sending notification to user \${userId}: \${message}\`)
        
        return new Response(
          JSON.stringify({ success: true }),
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

// Deploy image processing function
await deploy_edge_function({
  name: "process-image",
  code: `
    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
    
    serve(async (req) => {
      try {
        const { imageUrl } = await req.json()
        
        // Image processing logic
        // For example: resize, compress, add watermark
        
        return new Response(
          JSON.stringify({ 
            success: true,
            processedUrl: imageUrl
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400 }
        )
      }
    })
  `,
  verify_jwt: true
})

// List deployed functions
const functions = await list_edge_functions()
console.log("Deployed functions:", functions.data)
```

## Step 7: Configure Authentication

Set up authentication providers:

```typescript
// Get current auth config
const currentConfig = await get_auth_config()
console.log("Current auth config:", currentConfig.data)

// Update auth configuration
await update_auth_config({
  config: {
    site_url: "https://myapp.com",
    enable_signup: true,
    jwt_expiry: 3600,
    providers: [
      {
        name: "google",
        enabled: true,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET
      },
      {
        name: "github",
        enabled: true,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET
      }
    ]
  }
})
```

## Step 8: Monitoring and Maintenance

Set up regular monitoring:

```typescript
// Function to check system health
async function checkSystemHealth() {
  console.log("\n=== System Health Check ===")
  
  // Check Supabase services
  const health = await check_supabase_health()
  console.log("Supabase Services:")
  health.data.forEach(service => {
    const status = service.status === 'healthy' ? '✅' : '❌'
    console.log(`  ${status} ${service.name}`)
  })
  
  // Check Coolify application
  const appStatus = await get_coolify_application({
    uuid: deployment.data.uuid
  })
  console.log(`\nApplication Status: ${appStatus.data.status}`)
  
  // Check recent logs for errors
  const logs = await get_coolify_logs({
    uuid: deployment.data.uuid,
    lines: 50
  })
  
  const errors = logs.data.split('\n').filter(line => 
    line.toLowerCase().includes('error') || 
    line.toLowerCase().includes('failed')
  )
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Found ${errors.length} errors in recent logs`)
    errors.slice(0, 5).forEach(error => console.log(`  ${error}`))
  } else {
    console.log("\n✅ No errors in recent logs")
  }
}

// Run health check
await checkSystemHealth()

// Schedule regular checks (in production, use cron or similar)
// setInterval(checkSystemHealth, 300000) // Every 5 minutes
```

## Step 9: Backup Important Data

Document your configuration:

```typescript
// Export current configuration
const config = {
  deployment_uuid: deployment.data.uuid,
  created_at: new Date().toISOString(),
  
  migrations: await list_migrations(),
  storage_buckets: await list_storage_buckets(),
  edge_functions: await list_edge_functions(),
  auth_config: await get_auth_config(),
  
  environment_variables: {
    // Note: Actual values stored securely, not here
    SUPABASE_URL: process.env.SUPABASE_URL,
    // ... other non-sensitive config
  }
}

// Save configuration to file (for reference)
console.log("Configuration backup:", JSON.stringify(config, null, 2))
```

## Step 10: Test the Deployment

Test all components:

```typescript
// Test database access
const testQuery = await execute_sql({
  sql: "SELECT COUNT(*) FROM public.profiles;"
})
console.log("Database test:", testQuery.data)

// Test edge function
const functionTest = await invoke_edge_function({
  name: "send-notification",
  payload: {
    userId: "test-user-id",
    message: "Test notification"
  }
})
console.log("Edge function test:", functionTest.data)

// Test storage
const buckets = await list_storage_buckets()
console.log("Storage test:", `${buckets.data.length} buckets available`)

console.log("\n✅ All tests passed! Deployment is ready.")
```

## Production Checklist

Before going to production:

- [ ] All migrations deployed successfully
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Storage buckets configured with proper permissions
- [ ] Edge functions deployed and tested
- [ ] Authentication providers configured
- [ ] SSL/TLS certificates active
- [ ] Domain name configured and DNS updated
- [ ] Monitoring and alerting set up
- [ ] Backup strategy in place
- [ ] Load testing performed
- [ ] Security audit completed
- [ ] API rate limits configured
- [ ] CORS settings configured correctly
- [ ] Environment variables secured
- [ ] Documentation updated

## Updating the Deployment

When you need to update:

```typescript
// Update configuration
await update_supabase_deployment({
  uuid: deployment.data.uuid,
  config: {
    enable_graphql: true,
    environment_variables: {
      "NEW_FEATURE_FLAG": "enabled"
    }
  }
})

// Deploy new migration
await deploy_migration({
  name: "add_new_feature",
  sql: "-- Your migration SQL"
})

// Deploy updated edge function
await deploy_edge_function({
  name: "existing-function",
  code: "-- Updated code"
})
```

## Troubleshooting

If something goes wrong:

```typescript
// Check logs
const logs = await get_coolify_logs({
  uuid: deployment.data.uuid,
  lines: 200
})
console.log(logs.data)

// Check service health
const health = await check_supabase_health()
console.log(health.data)

// Restart if needed
await restart_coolify_application({
  uuid: deployment.data.uuid
})
```

## Next Steps

- Set up monitoring and alerting
- Configure automated backups
- Implement CI/CD pipeline
- Add more edge functions as needed
- Scale resources based on usage
- Review security settings regularly

---

For more information, see:
- [README.md](../README.md)
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Coolify Documentation](https://coolify.io/docs)

