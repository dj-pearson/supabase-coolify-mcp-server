# Troubleshooting Guide - Supabase Coolify MCP Server

This guide will help you diagnose and fix connection issues with your Supabase Coolify MCP Server.

## Quick Diagnosis

Run the automated diagnostic tool to quickly identify issues:

```bash
npm run diagnose
```

This will check:
- ✅ Environment file configuration
- ✅ Required environment variables
- ✅ Coolify connection and authentication
- ✅ Supabase connection and authentication
- ✅ Supabase services health
- ✅ Network connectivity

## Step-by-Step Troubleshooting

### Step 1: Check if .env File Exists

```bash
# Windows (PowerShell)
Test-Path .env

# Linux/Mac
ls -la .env
```

If the file doesn't exist, create it from the example:

```bash
# Windows (PowerShell)
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

### Step 2: Verify Environment Variables

Open your `.env` file and verify these **required** variables are set:

```bash
# Check your .env file (Windows PowerShell)
Get-Content .env

# Check your .env file (Linux/Mac)
cat .env
```

#### Required Variables:

1. **COOLIFY_API_URL**
   - Format: `http://localhost:8000` or `https://coolify.yourdomain.com`
   - ❌ Bad: Contains "example", "your-", or "localhost" if Coolify is remote
   - ✅ Good: Actual URL where Coolify is accessible

2. **COOLIFY_API_TOKEN**
   - Format: Starts with `clf_` or similar
   - ❌ Bad: `your-coolify-api-token-here`
   - ✅ Good: Actual token from Coolify dashboard
   - **How to get**: Coolify Dashboard → Keys & Tokens → API Tokens → Create New Token

3. **SUPABASE_URL**
   - Format: `https://your-project.supabase.co` or `https://supabase.yourdomain.com`
   - ❌ Bad: Contains "example" or "your-"
   - ✅ Good: Actual Supabase instance URL

4. **SUPABASE_SERVICE_ROLE_KEY**
   - Format: Long JWT token starting with `eyJhbGc...`
   - ❌ Bad: Anon key (public key)
   - ❌ Bad: Contains placeholder text
   - ✅ Good: Service role key (has admin privileges)
   - **Important**: Must be SERVICE ROLE KEY, not the anon key!

### Step 3: Common Issues and Solutions

#### Issue 1: "Missing required environment variables"

**Symptom**: Server fails to start with error about missing variables.

**Solution**:
```bash
# Check which variables are missing
npm run diagnose

# Edit .env file
# Windows: notepad .env
# Linux/Mac: nano .env
```

Add the missing variables from Step 2 above.

#### Issue 2: "Failed to connect to Coolify"

**Symptoms**:
- `ECONNREFUSED`: Connection refused
- `ENOTFOUND`: Host not found
- `ETIMEDOUT`: Connection timeout

**Solutions**:

1. **Check if Coolify is running**:
   ```bash
   # Try to access Coolify in browser
   # Navigate to your COOLIFY_API_URL
   ```

2. **Verify the URL is correct**:
   ```bash
   # In .env, check COOLIFY_API_URL
   # Should be: http://localhost:8000 (local)
   # Or: https://coolify.yourdomain.com (remote)
   ```

3. **Check firewall/network**:
   ```bash
   # Windows (PowerShell)
   Test-NetConnection -ComputerName coolify.yourdomain.com -Port 443
   
   # Linux/Mac
   curl -v https://coolify.yourdomain.com/api/v1/health
   ```

4. **Verify Coolify API is enabled**:
   - Log into Coolify dashboard
   - Check that API access is enabled
   - Verify the API endpoint is accessible

#### Issue 3: "Invalid API token" (Coolify)

**Symptom**: Connection succeeds but authentication fails (401 error).

**Solution**:

1. **Generate a new API token**:
   - Log into Coolify
   - Go to: Settings → Keys & Tokens → API Tokens
   - Click "Create New Token"
   - Give it a descriptive name (e.g., "MCP Server")
   - Copy the token (you won't see it again!)

2. **Update .env file**:
   ```bash
   COOLIFY_API_TOKEN=clf_your_new_token_here
   ```

3. **Restart the MCP server**

#### Issue 4: "Failed to connect to Supabase"

**Symptoms**:
- Cannot reach Supabase instance
- Connection timeout
- DNS errors

**Solutions**:

1. **Verify Supabase is running**:
   ```bash
   # Test in browser - should see "Welcome to Supabase"
   # Navigate to your SUPABASE_URL
   ```

2. **Check the URL format**:
   ```bash
   # In .env, SUPABASE_URL should be:
   # https://your-project.supabase.co (Supabase Cloud)
   # https://supabase.yourdomain.com (Self-hosted)
   # 
   # NO trailing slash!
   # ✅ Good: https://project.supabase.co
   # ❌ Bad:  https://project.supabase.co/
   ```

3. **Test connectivity**:
   ```bash
   # Windows (PowerShell)
   Invoke-WebRequest -Uri "$env:SUPABASE_URL/rest/v1/"
   
   # Linux/Mac
   curl $SUPABASE_URL/rest/v1/
   ```

#### Issue 5: "Invalid service role key" (Supabase)

**Symptom**: Connection succeeds but queries fail with JWT or 401 error.

**Common Mistake**: Using the **anon key** instead of **service role key**.

**Solution**:

1. **Find your service role key**:

   **For Supabase Cloud**:
   - Go to: https://app.supabase.com
   - Select your project
   - Settings → API
   - Copy the `service_role` key (NOT the `anon` key)

   **For Self-hosted Supabase**:
   - Check Coolify deployment environment variables
   - Look for `SERVICE_ROLE_KEY` (not `ANON_KEY`)
   - Or check your Supabase configuration

2. **Verify the key format**:
   ```bash
   # Service role keys start with: eyJhbGc...
   # They are LONG (hundreds of characters)
   # 
   # Anon keys also start with eyJhbGc... but have different permissions
   # Make SURE you're using the SERVICE ROLE key!
   ```

3. **Update .env**:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Issue 6: MCP Server Not Responding

**Symptom**: Server starts but doesn't respond to commands.

**Solution**:

1. **Check if server is running**:
   ```bash
   # Look for error messages in the console
   # Server should print: "✅ Supabase Coolify MCP Server running on stdio"
   ```

2. **Verify MCP configuration in Cursor**:
   - Open Cursor settings
   - Check MCP server configuration
   - Ensure the server path is correct

3. **Restart Cursor and the MCP server**

4. **Check logs for errors**

## Advanced Diagnostics

### Test Coolify API Manually

```bash
# Windows (PowerShell)
$headers = @{
    "Authorization" = "Bearer $env:COOLIFY_API_TOKEN"
    "Content-Type" = "application/json"
}
Invoke-WebRequest -Uri "$env:COOLIFY_API_URL/api/v1/applications" -Headers $headers

# Linux/Mac
curl -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
     -H "Content-Type: application/json" \
     $COOLIFY_API_URL/api/v1/applications
```

Expected: JSON response with list of applications (or empty array).

### Test Supabase API Manually

```bash
# Windows (PowerShell)
$headers = @{
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "apikey" = "$env:SUPABASE_SERVICE_ROLE_KEY"
}
Invoke-WebRequest -Uri "$env:SUPABASE_URL/rest/v1/" -Headers $headers

# Linux/Mac
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     $SUPABASE_URL/rest/v1/
```

Expected: OpenAPI specification or similar response (status 200).

### Using the Built-in verify_setup Tool

Once the MCP server is running, you can use the built-in verification tool:

```typescript
// In Cursor, call the MCP tool:
verify_setup

// This will run comprehensive checks and return a detailed report
```

## Environment Variable Checklist

Use this checklist to verify your configuration:

- [ ] `.env` file exists in project root
- [ ] `COOLIFY_API_URL` is set to actual Coolify URL
- [ ] `COOLIFY_API_URL` does NOT contain "example" or "your-"
- [ ] `COOLIFY_API_TOKEN` is set to actual token from Coolify
- [ ] `COOLIFY_API_TOKEN` starts with `clf_` or similar prefix
- [ ] `SUPABASE_URL` is set to actual Supabase URL
- [ ] `SUPABASE_URL` does NOT have trailing slash
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is SERVICE ROLE key (not anon key)
- [ ] Both services are accessible from your network
- [ ] Firewall allows connections to both services

## Still Having Issues?

1. **Run the diagnostic tool again**:
   ```bash
   npm run diagnose
   ```

2. **Check the detailed error messages** - they often contain helpful information

3. **Verify network connectivity**:
   - Can you access both Coolify and Supabase in a web browser?
   - Are there any proxy or VPN settings interfering?

4. **Check service logs**:
   - Coolify: Check application logs in Coolify dashboard
   - Supabase: Check logs for your Supabase instance

5. **Create an issue** on GitHub with:
   - Output from `npm run diagnose`
   - Error messages from the MCP server
   - Steps you've already tried
   - Your environment (OS, Node version)

## Security Notes

⚠️ **Important Security Reminders**:

- **NEVER** commit your `.env` file to version control
- **NEVER** share your API tokens or service role keys
- **ALWAYS** use the service role key (not anon key) for the MCP server
- **ROTATE** your API tokens regularly
- **RESTRICT** API token permissions if possible

## Quick Reference: Getting Credentials

### Coolify API Token

1. Log into Coolify dashboard
2. Navigate to: **Keys & Tokens** → **API Tokens**
3. Click **"Create New Token"**
4. Give it a name (e.g., "MCP Server")
5. Click **Create**
6. **Copy the token immediately** (you won't see it again!)
7. Paste into `.env` file as `COOLIFY_API_TOKEN`

### Supabase Service Role Key

**For Supabase Cloud:**
1. Go to https://app.supabase.com
2. Select your project
3. Click **Settings** (gear icon)
4. Click **API** in the sidebar
5. Find **Project API keys** section
6. Copy the **`service_role`** key (NOT the `anon` key)
7. Paste into `.env` file as `SUPABASE_SERVICE_ROLE_KEY`

**For Self-hosted Supabase:**
1. Go to your Coolify dashboard
2. Find your Supabase deployment
3. Open **Environment Variables**
4. Find `SERVICE_ROLE_KEY` variable
5. Copy its value
6. Paste into `.env` file as `SUPABASE_SERVICE_ROLE_KEY`

## Next Steps

Once you've resolved the connection issues:

1. Run the diagnostic tool to confirm everything is working:
   ```bash
   npm run diagnose
   ```

2. Start the MCP server:
   ```bash
   npm run dev
   ```

3. Use the `verify_setup` tool within Cursor to get a detailed system report

4. Start using the MCP tools! See [README.md](README.md) for usage examples.

