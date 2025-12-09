# System Verification Guide

Complete guide to verifying your Supabase Coolify MCP Server setup.

## Overview

The MCP server includes comprehensive health checking and verification tools to ensure everything is working correctly before you start deploying.

## Automatic Startup Checks

When the server starts, it automatically performs health checks on critical services:

```
🔍 Running startup health checks...

✅ All critical services are healthy
```

Or if there are issues:

```
🔍 Running startup health checks...

⚠️  Issues detected:
   ❌ Coolify: Connection timeout
   ❌ Supabase: Invalid service role key

⚠️  Some services are not available. The server will start but some tools may not work.
   Run the "verify_setup" tool for detailed diagnostics.
```

## Manual Verification Tool

### `verify_setup`

Run comprehensive health checks on all services.

**Usage with Claude:**
```
"Verify my setup and check if everything is working"
```

or

```
"Run the verification tool"
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "overall_status": "healthy",
    "checks": [
      {
        "service": "Coolify Connection",
        "status": "healthy",
        "message": "Connected successfully (234ms)",
        "details": {
          "response_time": 234,
          "applications_count": 5
        },
        "timestamp": "2023-12-15T10:30:00.000Z"
      },
      {
        "service": "Supabase Connection",
        "status": "healthy",
        "message": "Connected successfully (156ms)",
        "details": {
          "response_time": 156,
          "version": "1.0.0"
        },
        "timestamp": "2023-12-15T10:30:00.000Z"
      }
    ],
    "summary": {
      "total": 6,
      "healthy": 5,
      "unhealthy": 0,
      "warnings": 1
    }
  },
  "message": "All systems operational"
}
```

## Health Check Categories

### 1. Coolify Connection
Verifies that the Coolify API is reachable.

**Status Indicators:**
- ✅ **Healthy**: Connection successful, API responding
- ⚠️ **Warning**: Connection slow or intermittent
- ❌ **Unhealthy**: Cannot connect to Coolify

**Common Issues:**
- Wrong `COOLIFY_API_URL`
- Coolify instance not running
- Network/firewall blocking connection

### 2. Coolify Authentication
Verifies that your API token is valid.

**Status Indicators:**
- ✅ **Healthy**: API token is valid
- ❌ **Unhealthy**: Invalid or expired token

**Common Issues:**
- Incorrect `COOLIFY_API_TOKEN`
- Token expired or revoked
- Insufficient permissions

**Fix:**
1. Go to Coolify Dashboard
2. Navigate to "Keys & Tokens" → "API tokens"
3. Generate a new token
4. Update your `.env` file

### 3. Supabase Connection
Verifies that the Supabase instance is reachable.

**Status Indicators:**
- ✅ **Healthy**: Connection successful
- ⚠️ **Warning**: Connection slow
- ❌ **Unhealthy**: Cannot connect

**Common Issues:**
- Wrong `SUPABASE_URL`
- Supabase instance not running
- SSL/TLS certificate issues

### 4. Supabase Authentication
Verifies that your service role key is valid.

**Status Indicators:**
- ✅ **Healthy**: Service role key is valid
- ❌ **Unhealthy**: Invalid or expired key

**Common Issues:**
- Incorrect `SUPABASE_SERVICE_ROLE_KEY`
- Using anon key instead of service role key
- JWT secret mismatch

**Fix:**
1. Check your Supabase deployment environment variables
2. Look for `SERVICE_ROLE_KEY`
3. Update your `.env` file

### 5. Supabase Database
Verifies database access via SQL execution.

**Status Indicators:**
- ✅ **Healthy**: Database is accessible
- ⚠️ **Warning**: Database access issue (migrations may still work via API)
- ❌ **Unhealthy**: Cannot access database

**Note:** This is optional for most operations. The MCP server works via Supabase's REST API.

### 6. Supabase CLI
Checks if the Supabase CLI is installed.

**Status Indicators:**
- ✅ **Healthy**: CLI installed and working
- ⚠️ **Warning**: CLI not installed (CLI tools won't work)

**Fix:**
```bash
npm install -g supabase
```

**Note:** This is optional. Only needed if you want to use CLI tools like `supabase_init`, `supabase_gen_types`, etc.

## Overall Status

### Healthy ✅
All critical services are operational. You can use all features.

### Degraded ⚠️
Some non-critical services have warnings. Core features work, but some tools may be limited.

**Example:**
- Coolify and Supabase work
- CLI not installed → CLI tools unavailable
- Database direct access issues → Use API instead

### Unhealthy ❌
Critical services are unavailable. The server runs but most tools won't work.

**Action Required:**
- Fix Coolify connection issues
- Fix Supabase connection issues
- Verify environment variables

## Verification Workflow

### Initial Setup Verification

```typescript
// Step 1: Start the server
npm run build
npm start

// Step 2: Check startup logs
// Look for "✅ All critical services are healthy"

// Step 3: Run verification tool via Claude
"Run verify_setup and show me the results"

// Step 4: Fix any issues found
```

### Pre-Deployment Verification

Before deploying to production, verify:

```typescript
// 1. Run full verification
"Verify my setup"

// 2. Check each service
"What's the status of Coolify connection?"
"Is Supabase authentication working?"

// 3. Test a simple operation
"List my Coolify applications"
"Check the health of Supabase services"
```

### Periodic Health Checks

Run verification regularly:

```typescript
// Daily check
"Run verification and let me know if anything is wrong"

// Before important operations
"Verify setup before I deploy this migration"

// After configuration changes
"I updated my environment variables, verify the setup"
```

## Troubleshooting Guide

### Issue: All Services Unhealthy

**Symptoms:**
```
⚠️  Issues detected:
   ❌ Coolify: Connection timeout
   ❌ Supabase: Connection timeout
```

**Diagnosis:**
- Network connectivity issue
- Wrong environment variables
- Services not running

**Solutions:**
1. Check your internet connection
2. Verify `COOLIFY_API_URL` is correct
3. Verify `SUPABASE_URL` is correct
4. Check if services are running
5. Try accessing URLs in browser

### Issue: Authentication Failures

**Symptoms:**
```
❌ Coolify Authentication: Invalid API token
❌ Supabase Authentication: Invalid service role key
```

**Diagnosis:**
- Wrong API tokens
- Expired credentials

**Solutions:**
1. Regenerate Coolify API token
2. Check Supabase service role key
3. Update `.env` file
4. Restart the server

### Issue: Slow Connections

**Symptoms:**
```
⚠️ Coolify Connection: Connected successfully (5234ms)
```

**Diagnosis:**
- Network latency
- Server under load
- DNS issues

**Solutions:**
1. Check network speed
2. Verify server resources
3. Consider using closer servers
4. Check DNS resolution

### Issue: CLI Not Available

**Symptoms:**
```
⚠️ Supabase CLI: CLI not installed
```

**Diagnosis:**
- Supabase CLI not installed

**Solutions:**
```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version

# Run verification again
"Verify my setup"
```

## Best Practices

### 1. Verify After Installation

Always run verification after initial setup:

```bash
# After npm install and configuration
npm run build
npm start

# Then via Claude
"Run verify_setup"
```

### 2. Verify After Changes

Run verification after:
- Updating environment variables
- Changing Coolify/Supabase URLs
- Regenerating API tokens
- Server restarts

### 3. Regular Health Checks

Set up periodic verification:
- Daily: Quick check
- Weekly: Full verification
- Before deployments: Always verify

### 4. Monitor Response Times

Watch for degrading performance:
- Normal: < 500ms
- Acceptable: 500ms - 2000ms
- Slow: > 2000ms (investigate)

### 5. Document Your Setup

Keep a record of verification results:
```typescript
// Save verification output
"Verify setup and save the results"

// Include in deployment docs
// Include in incident reports
```

## Integration with CI/CD

You can use verification in automated pipelines:

```bash
#!/bin/bash
# verify-setup.sh

# Start server in background
npm start &
SERVER_PID=$!

# Wait for startup
sleep 5

# Run verification (would need a CLI wrapper)
# For now, manual verification recommended

# Clean up
kill $SERVER_PID
```

## Response Time Benchmarks

**Expected response times:**

| Service | Good | Acceptable | Slow |
|---------|------|------------|------|
| Coolify Connection | < 200ms | < 1000ms | > 1000ms |
| Coolify Auth | < 200ms | < 1000ms | > 1000ms |
| Supabase Connection | < 200ms | < 1000ms | > 1000ms |
| Supabase Auth | < 200ms | < 1000ms | > 1000ms |
| Supabase Database | < 500ms | < 2000ms | > 2000ms |
| Supabase CLI | < 100ms | < 500ms | > 500ms |

## Example Verification Session

### Healthy System

```
You: "Verify my setup"
