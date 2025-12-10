# 🔍 Diagnose Your MCP Connection Issues - START HERE

## Quick Diagnosis (Do This First!)

Run this command in your terminal:

```bash
npm run diagnose
```

This will automatically check:
- ✅ If your `.env` file exists
- ✅ If all required environment variables are set
- ✅ If your Coolify connection works
- ✅ If your Supabase connection works
- ✅ Authentication for both services
- ✅ Network connectivity

**The diagnostic tool will tell you exactly what's wrong!**

---

## Most Common Issues

### 1. ❌ Missing or Wrong `.env` File

**Problem**: You don't have a `.env` file or it's named wrong.

**Solution**:
```bash
# Create .env from example (Windows PowerShell)
Copy-Item env.example .env

# Create .env from example (Linux/Mac)
cp env.example .env
```

Then edit `.env` and fill in your actual credentials (see below).

---

### 2. ❌ Placeholder Values in `.env`

**Problem**: Your `.env` still has example/placeholder values like:
```
COOLIFY_API_TOKEN=your-coolify-api-token-here
SUPABASE_URL=https://your-supabase-instance.example.com
```

**Solution**: Replace ALL placeholder values with real credentials:

```bash
# Open and edit your .env file:
# Windows: notepad .env
# Linux/Mac: nano .env
```

**What you need to change:**

```env
# ❌ WRONG - these are placeholders:
COOLIFY_API_URL=http://localhost:8000
COOLIFY_API_TOKEN=your-coolify-api-token-here
SUPABASE_URL=https://your-supabase-instance.example.com
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ✅ CORRECT - actual values:
COOLIFY_API_URL=https://coolify.mydomain.com
COOLIFY_API_TOKEN=clf_1234567890abcdef...
SUPABASE_URL=https://myproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. ❌ Using Wrong Supabase Key

**Problem**: You're using the **anon key** instead of **service role key**.

**How to tell**:
- Both keys start with `eyJhbGc...`
- Both are very long JWT tokens
- But only the SERVICE ROLE key works for admin operations!

**Solution**: Get the correct key:

**Supabase Cloud**:
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy the **`service_role`** key ⬅️ THIS ONE!
5. (NOT the `anon` key)

**Self-hosted Supabase** (on Coolify):
1. Open Coolify dashboard
2. Go to your Supabase deployment
3. Environment Variables
4. Find `SERVICE_ROLE_KEY` ⬅️ Copy this value
5. (NOT `ANON_KEY`)

---

### 4. ❌ Can't Get Coolify API Token

**Solution**:

1. Log into your Coolify dashboard
2. Click on your profile/avatar (top right)
3. Go to: **Keys & Tokens**
4. Click **API Tokens** tab
5. Click **"Create New Token"**
6. Give it a name: "MCP Server"
7. Click **Create**
8. **COPY THE TOKEN NOW** (you won't see it again!)
9. Paste into `.env` as `COOLIFY_API_TOKEN`

---

## Step-by-Step: Fix Your Configuration

### Step 1: Check if .env exists

```bash
# Windows PowerShell
Test-Path .env

# Linux/Mac
ls -la .env
```

If it says "False" or file not found, create it:
```bash
# Windows
Copy-Item env.example .env

# Linux/Mac  
cp env.example .env
```

### Step 2: View your current .env

```bash
# Windows PowerShell
Get-Content .env

# Linux/Mac
cat .env
```

### Step 3: Edit .env with real values

```bash
# Windows
notepad .env

# Linux/Mac
nano .env
```

### Step 4: Fill in these REQUIRED values:

```env
# Coolify Configuration
COOLIFY_API_URL=https://your-actual-coolify-url.com
COOLIFY_API_TOKEN=clf_your_actual_token_here

# Supabase Configuration  
SUPABASE_URL=https://your-actual-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your ACTUAL service role key)
```

### Step 5: Save and test

```bash
npm run diagnose
```

---

## Expected Output When Working

When everything is configured correctly, you should see:

```
🔍 SUPABASE COOLIFY MCP SERVER DIAGNOSTICS
═══════════════════════════════════════

✅ .env File: .env file found
✅ ENV: COOLIFY_API_URL: Set correctly
✅ ENV: COOLIFY_API_TOKEN: Set correctly
✅ ENV: SUPABASE_URL: Set correctly
✅ ENV: SUPABASE_SERVICE_ROLE_KEY: Set correctly
✅ Coolify Connection: Successfully connected to Coolify
✅ Coolify Authentication: Successfully authenticated with Coolify
✅ Supabase Connection: Successfully connected to Supabase
✅ Supabase Authentication: Successfully authenticated with Supabase
✅ Supabase Services: All services are healthy
✅ Network Connectivity: Internet connection is working

📊 DIAGNOSTIC SUMMARY
═══════════════════
✅ Passed:   10
❌ Failed:   0
⚠️  Warnings: 0

🟢 ALL CHECKS PASSED - MCP Server should work correctly
```

---

## If Diagnostics Still Fail

### Connection Refused (ECONNREFUSED)
- Your Coolify or Supabase is not running
- URL is wrong
- Check firewall settings

**Test manually**:
```bash
# Try opening these URLs in your browser:
# - Your COOLIFY_API_URL
# - Your SUPABASE_URL

# Should NOT show connection error
```

### Invalid Token (401 Unauthorized)
- Your API token is wrong or expired
- Generate a new token (see above)
- Make sure you copied the entire token

### DNS Error (ENOTFOUND)
- Hostname doesn't exist
- Check your URL spelling
- Make sure domain is accessible

---

## Need More Help?

1. **Read the full troubleshooting guide**:
   ```bash
   # Open TROUBLESHOOTING.md
   ```

2. **Check example configuration**:
   ```bash
   # View env.example for format reference
   # Windows: type env.example
   # Linux/Mac: cat env.example
   ```

3. **Test connections manually** - see TROUBLESHOOTING.md for curl/PowerShell commands

4. **Still stuck?** Open an issue on GitHub with:
   - Output from `npm run diagnose`
   - Your `.env` (with sensitive values masked!)
   - Error messages you're seeing

---

## Security Reminder

⚠️ **NEVER commit your `.env` file to git!**

⚠️ **NEVER share your API tokens or service role keys!**

The `.env` file is already in `.gitignore`, but be careful when sharing error logs or screenshots.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│  REQUIRED ENVIRONMENT VARIABLES                 │
├─────────────────────────────────────────────────┤
│  COOLIFY_API_URL                                │
│    Format: https://coolify.yourdomain.com       │
│    Get from: Your Coolify installation          │
│                                                  │
│  COOLIFY_API_TOKEN                              │
│    Format: clf_xxxxx...                         │
│    Get from: Coolify → Keys & Tokens            │
│                                                  │
│  SUPABASE_URL                                   │
│    Format: https://project.supabase.co          │
│    Get from: Supabase project dashboard         │
│                                                  │
│  SUPABASE_SERVICE_ROLE_KEY                      │
│    Format: eyJhbGc...                           │
│    Get from: Supabase → Settings → API          │
│    ⚠️  Use SERVICE ROLE key, NOT anon key!      │
└─────────────────────────────────────────────────┘
```

---

**Now run**: `npm run diagnose` and follow the output!

