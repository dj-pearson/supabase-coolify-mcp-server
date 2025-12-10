# 🔧 MCP Configuration Guide

## Environment Variable Priority Chain

The MCP server supports **three ways** to provide environment variables, checked in this order:

1. **MCP Config `env` Section** (Highest Priority) ⭐ Recommended for MCP usage
2. **System Environment Variables** (Medium Priority) ⭐ Recommended for security
3. **`.env` File** (Lowest Priority) ⭐ Recommended for development only

**The server will use the first value it finds for each variable.**

---

## ✅ Option 1: MCP Config (Recommended for MCP Usage)

Best for: Quick setup, per-project configuration

### Cursor

Location: Cursor Settings → MCP Servers (or `.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://api.tryeatpal.com:8000",
        "COOLIFY_API_TOKEN": "your-actual-coolify-token",
        "SUPABASE_URL": "https://api.tryeatpal.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-actual-service-role-key"
      }
    }
  }
}
```

**Pros:**
- ✅ Quick to set up
- ✅ Per-project configuration
- ✅ Works immediately

**Cons:**
- ⚠️ Credentials visible in config file
- ⚠️ Need to update config when credentials change

---

## ✅ Option 2: System Environment Variables (Recommended for Security)

Best for: Security-conscious users, multiple projects

### Windows (PowerShell - Run as Administrator)

```powershell
# Set user environment variables (permanent)
[System.Environment]::SetEnvironmentVariable('COOLIFY_API_URL', 'http://api.tryeatpal.com:8000', 'User')
[System.Environment]::SetEnvironmentVariable('COOLIFY_API_TOKEN', 'your-actual-token', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_URL', 'https://api.tryeatpal.com', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'your-actual-key', 'User')

# Restart Cursor after setting
```

### Windows (GUI Method)

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to **Advanced** tab → **Environment Variables**
3. Under **User variables**, click **New** for each:
   - `COOLIFY_API_URL` → `http://api.tryeatpal.com:8000`
   - `COOLIFY_API_TOKEN` → `[your token]`
   - `SUPABASE_URL` → `https://api.tryeatpal.com`
   - `SUPABASE_SERVICE_ROLE_KEY` → `[your key]`
4. Click **OK**, restart Cursor

### Linux/Mac (Bash/Zsh)

```bash
# Add to ~/.bashrc or ~/.zshrc
export COOLIFY_API_URL="http://api.tryeatpal.com:8000"
export COOLIFY_API_TOKEN="your-actual-token"
export SUPABASE_URL="https://api.tryeatpal.com"
export SUPABASE_SERVICE_ROLE_KEY="your-actual-key"

# Reload shell
source ~/.bashrc  # or ~/.zshrc
```

### MCP Config (Minimal)

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"]
    }
  }
}
```

**Pros:**
- ✅ Credentials NOT in config files
- ✅ Available to all applications
- ✅ Secure (user-level permissions)
- ✅ Easy to update globally

**Cons:**
- ⚠️ Requires system configuration
- ⚠️ Need to restart applications to pick up changes

---

## ✅ Option 3: .env File (Recommended for Development)

Best for: Local development, testing, rapid iteration

### Setup

1. **Create `.env` file** in project root:
```bash
# c:\Users\pears\Documents\Coolify\supabase-coolify-mcp-server\.env

COOLIFY_API_URL=http://api.tryeatpal.com:8000
COOLIFY_API_TOKEN=your-actual-token
SUPABASE_URL=https://api.tryeatpal.com
SUPABASE_SERVICE_ROLE_KEY=your-actual-key
```

2. **Use wrapper script** with MCP:

**For Windows (start-mcp.ps1):**
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "pwsh",
      "args": [
        "-ExecutionPolicy", "Bypass",
        "-File",
        "c:\\Users\\pears\\Documents\\Coolify\\supabase-coolify-mcp-server\\start-mcp.ps1"
      ]
    }
  }
}
```

**For Linux/Mac (start-mcp.sh):**
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "/path/to/supabase-coolify-mcp-server/start-mcp.sh"
    }
  }
}
```

**Pros:**
- ✅ Credentials NOT in MCP config
- ✅ Easy to update (edit `.env`)
- ✅ Gitignored (secure)
- ✅ Standard development practice

**Cons:**
- ⚠️ Requires wrapper script
- ⚠️ Only works from project directory

---

## 🎯 Recommended Setups by Use Case

### For Production / Daily Use
**Use Option 2: System Environment Variables**
- Set once, works everywhere
- Most secure
- No config file modifications needed

### For MCP Quick Start
**Use Option 1: MCP Config**
- Fastest to set up
- Works immediately
- Good for trying out the server

### For Development
**Use Option 3: .env File**
- Easy to change credentials
- Standard development workflow
- Credentials stay in gitignored file

### For Maximum Security
**Use Option 2 + Wrapper Script**
- System env vars for credentials
- Minimal MCP config
- Nothing sensitive in config files

---

## 🔀 Mixed Configuration (Hybrid Approach)

You can mix approaches! The server checks in priority order:

**Example: Non-sensitive in config, sensitive in system env:**

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://api.tryeatpal.com:8000",
        "SUPABASE_URL": "https://api.tryeatpal.com"
      }
    }
  }
}
```

Then set system environment variables for:
- `COOLIFY_API_TOKEN` (from system)
- `SUPABASE_SERVICE_ROLE_KEY` (from system)

**Result:** URLs in config (not sensitive), tokens from system env (secure)!

---

## 📋 Configuration Examples Summary

### Example 1: All in MCP Config (Quick Start)
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://api.tryeatpal.com:8000",
        "COOLIFY_API_TOKEN": "your-token",
        "SUPABASE_URL": "https://api.tryeatpal.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-key"
      }
    }
  }
}
```

### Example 2: System Env Vars Only (Secure)
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"]
    }
  }
}
```
*Set env vars at system level first*

### Example 3: .env File with Wrapper (Development)
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "pwsh",
      "args": [
        "-ExecutionPolicy", "Bypass",
        "-File",
        "C:\\path\\to\\start-mcp.ps1"
      ]
    }
  }
}
```
*Credentials in `.env` file*

### Example 4: Hybrid (Best of Both)
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://api.tryeatpal.com:8000",
        "SUPABASE_URL": "https://api.tryeatpal.com"
      }
    }
  }
}
```
*Tokens from system environment variables*

---

## 📊 Configuration Comparison

| Approach | Security | Ease of Setup | Flexibility | Best For |
|----------|----------|---------------|-------------|----------|
| **MCP Config** | ⚠️ Low | ⭐⭐⭐ Easy | ⭐⭐ Medium | Quick start, testing |
| **System Env** | ⭐⭐⭐ High | ⭐⭐ Medium | ⭐⭐⭐ High | Production, security |
| **.env + Wrapper** | ⭐⭐ Medium | ⭐⭐ Medium | ⭐⭐⭐ High | Development |
| **Hybrid** | ⭐⭐⭐ High | ⭐⭐ Medium | ⭐⭐⭐ High | Best overall |

---

## 🧪 Testing Your Configuration

After configuring, test that environment variables are loaded:

1. **Restart your MCP client** (Cursor, Claude Desktop, etc.)

2. **Run the verify_setup tool**:
   ```
   "Run verify_setup to check if everything is configured correctly"
   ```

3. **Check the output**:
   - ✅ Should show your actual URLs (not placeholders)
   - ✅ All 4 required variables present
   - ✅ Connections working

4. **Test a simple command**:
   ```
   "List all Coolify applications"
   ```

---

## 🔍 Troubleshooting

### Issue: Server shows "Missing required environment variables"

**Cause:** Environment variables not provided in any of the three ways

**Fix:**
1. Check MCP config has `env` section OR
2. Check system env vars are set OR  
3. Check `.env` file exists and wrapper script is used

### Issue: Server shows placeholder URLs

**Cause:** Using placeholder values instead of actual credentials

**Fix:**
1. Replace `your-supabase-instance.example.com` with actual URL
2. Replace `your-token-here` with actual credentials
3. Restart MCP client

### Issue: System env vars not working

**Cause:** MCP client not restarted or env vars not set correctly

**Fix:**
1. Completely close and reopen Cursor/Claude Desktop
2. Verify env vars: `echo $env:COOLIFY_API_URL` (PowerShell)
3. Check env vars are under "User" not "System" (easier to manage)

### Issue: .env file not loading

**Cause:** Not using wrapper script

**Fix:**
1. You MUST use the wrapper script (`start-mcp.ps1` or `start-mcp.sh`)
2. Update MCP config to call the wrapper script
3. The wrapper loads `.env` then starts the server

---

## 🎯 Quick Start Checklist

Choose your approach:

**Option 1 - Quick (MCP Config):**
- [ ] Add `env` section to MCP config
- [ ] Add all 4 required variables
- [ ] Use actual values (not placeholders)
- [ ] Restart MCP client
- [ ] Test with `verify_setup`

**Option 2 - Secure (System Env):**
- [ ] Set system environment variables
- [ ] Use minimal MCP config (no `env` section)
- [ ] Restart MCP client
- [ ] Test with `verify_setup`

**Option 3 - Development (.env):**
- [ ] Create/update `.env` file with credentials
- [ ] Use wrapper script in MCP config
- [ ] Restart MCP client
- [ ] Test with `verify_setup`

---

## 📚 Additional Resources

- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Environment Variables Reference](env.example)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)

---

**Remember:** The server will check for environment variables in this priority order:
1. MCP config `env` section (highest)
2. System environment variables (medium)
3. `.env` file (lowest)

Choose the approach that best fits your security needs and workflow!

### For VS Code / Copilot

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://api.tryeatpal.com:8000",
        "COOLIFY_API_TOKEN": "your-actual-coolify-token",
        "SUPABASE_URL": "https://api.tryeatpal.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-actual-service-role-key"
      }
    }
  }
}
```

---

## 📋 Required Environment Variables

These MUST be in your MCP configuration `env` section:

| Variable | Description | Example |
|----------|-------------|---------|
| `COOLIFY_API_URL` | Your Coolify instance URL | `http://api.tryeatpal.com:8000` |
| `COOLIFY_API_TOKEN` | API token from Coolify | `1\|FaSctU...c715` |
| `SUPABASE_URL` | Your Supabase instance URL | `https://api.tryeatpal.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ0eXAi...W6rs` |

---

## 🔧 Optional Environment Variables

Add these if needed:

```json
"env": {
  "COOLIFY_API_URL": "http://api.tryeatpal.com:8000",
  "COOLIFY_API_TOKEN": "your-token",
  "SUPABASE_URL": "https://api.tryeatpal.com",
  "SUPABASE_SERVICE_ROLE_KEY": "your-key",
  
  "COOLIFY_TEAM_ID": "optional-team-id",
  "SUPABASE_ANON_KEY": "optional-anon-key",
  "SUPABASE_PROJECT_ID": "optional-project-id",
  "SUPABASE_PROJECT_REF": "optional-project-ref",
  "SUPABASE_FUNCTIONS_URL": "https://api.tryeatpal.com/functions/v1",
  
  "SUPABASE_DB_HOST": "localhost",
  "SUPABASE_DB_PORT": "5432",
  "SUPABASE_DB_NAME": "postgres",
  "SUPABASE_DB_USER": "postgres",
  "SUPABASE_DB_PASSWORD": "your-db-password",
  
  "SUPABASE_ACCESS_TOKEN": "optional-cli-token",
  "SUPABASE_DB_URL": "optional-connection-string"
}
```

---

## ❌ Common Mistakes

### 1. Using `.env` file for MCP

❌ **WRONG:** Creating a `.env` file and expecting MCP to read it
```bash
# This WON'T work for MCP!
echo "COOLIFY_API_URL=..." > .env
```

✅ **CORRECT:** Add variables to MCP configuration `env` section

### 2. Using Placeholder Values

❌ **WRONG:** Leaving example values in configuration
```json
"SUPABASE_URL": "https://your-supabase-instance.example.com"
```

✅ **CORRECT:** Use your actual values
```json
"SUPABASE_URL": "https://api.tryeatpal.com"
```

### 3. Missing Quotes

❌ **WRONG:** Unquoted values
```json
"COOLIFY_API_URL": http://api.tryeatpal.com:8000
```

✅ **CORRECT:** All values must be quoted strings
```json
"COOLIFY_API_URL": "http://api.tryeatpal.com:8000"
```

---

## 🧪 Testing Your Configuration

After updating your MCP configuration:

1. **Restart your MCP client** (Cursor, Claude Desktop, etc.)

2. **Test the server**:
   ```
   Ask: "Run verify_setup to check if everything is configured correctly"
   ```

3. **Check for errors**:
   - Look at the MCP server logs
   - In Cursor: Output → Model Context Protocol
   - In Claude Desktop: Check the logs in the application

4. **Verify environment variables**:
   ```
   Ask: "What is the current Coolify API URL and Supabase URL?"
   ```
   
   Should show your actual URLs, not placeholders!

---

## 🔍 Troubleshooting

### Server Shows Placeholder URLs

**Problem:** Server is showing `your-supabase-instance.example.com`

**Cause:** Environment variables not passed to MCP server

**Fix:**
1. Open your MCP configuration file
2. Add all required env vars to the `env` section
3. Restart your MCP client
4. Verify with `verify_setup` tool

### "Missing required environment variables" Error

**Problem:** Server fails to start

**Cause:** Required env vars not in MCP configuration

**Fix:**
1. Add at minimum these 4 required variables:
   - `COOLIFY_API_URL`
   - `COOLIFY_API_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Restart MCP client

### Server Not Connecting

**Problem:** Can't connect to Coolify or Supabase

**Fix:**
1. Verify URLs are accessible from your machine
2. Check firewall settings
3. Verify API tokens are correct
4. Use `verify_setup` tool for diagnostics

---

## 📝 Example Working Configuration

Here's a complete working example (with fake credentials):

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://api.tryeatpal.com:8000",
        "COOLIFY_API_TOKEN": "1|FaSctUaBcXyz123...",
        "SUPABASE_URL": "https://api.tryeatpal.com",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
      }
    }
  }
}
```

**After configuration:**
- Restart Cursor/Claude Desktop
- Server should connect immediately
- No placeholder URLs
- All tools available

---

## 🎯 Quick Start Checklist

- [ ] Open MCP configuration file for your client
- [ ] Add `mcpServers` section if not present
- [ ] Add `supabase-coolify` server configuration
- [ ] Add `env` section with all 4 required variables
- [ ] Use your ACTUAL credentials (not placeholders)
- [ ] Save the configuration file
- [ ] Restart your MCP client
- [ ] Test with `verify_setup` tool
- [ ] Verify no placeholder URLs appear

---

## 📚 Additional Resources

- [MCP Configuration Guide](https://modelcontextprotocol.io/docs/configuration)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Environment Variables Reference](env.example)

---

**Remember:** The `.env` file is ONLY used when running the server directly with `npm run dev`. For MCP usage, you MUST configure environment variables in your MCP client configuration!


