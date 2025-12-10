# 🔄 Upgrade Guide

This guide will help you upgrade your Supabase Coolify MCP Server to the latest version.

## 📦 Quick Upgrade

### Method 1: Global Installation (Recommended)

If you installed globally with npm:

```bash
npm update -g supabase-coolify-mcp-server
```

Or reinstall to ensure latest version:

```bash
npm uninstall -g supabase-coolify-mcp-server
npm install -g supabase-coolify-mcp-server
```

### Method 2: Using NPX (No Action Needed!)

If you're using npx in your MCP configuration, you're always using the latest version automatically:

```json
{
  "command": "npx",
  "args": ["-y", "supabase-coolify-mcp-server"]
}
```

The `-y` flag ensures npx always fetches the latest version.

### Method 3: From Source

If you cloned the repository:

```bash
cd supabase-coolify-mcp-server
git pull origin main
npm install
npm run build
```

---

## 🔄 Upgrading from v1.1.x to v1.2.0

### What's New in v1.2.0

✨ **New Features**:
- Built-in diagnostic tools (`npm run diagnose`)
- Platform-specific diagnostic scripts (Windows/Linux/Mac)
- Comprehensive health checking
- Enhanced error messages with fix suggestions
- Automated connection testing

📚 **New Documentation**:
- START_HERE.md - Quick start guide
- DIAGNOSE_NOW.md - Troubleshooting quick start
- TROUBLESHOOTING.md - Comprehensive troubleshooting
- UPGRADE.md - This guide!

🔧 **Improvements**:
- Better startup health checks
- More detailed error messages
- Improved connection diagnostics
- Enhanced validation

### Breaking Changes

**None!** v1.2.0 is fully backward compatible with v1.1.x.

Your existing configuration will continue to work without any changes.

### Migration Steps

1. **Update the package**:
   ```bash
   npm update -g supabase-coolify-mcp-server
   ```

2. **Verify the update**:
   ```bash
   supabase-coolify-mcp --version
   # Should show: 1.2.0 or higher
   ```

3. **Test your setup** (optional but recommended):
   ```bash
   # Download diagnostic script
   curl -o diagnose.ts https://raw.githubusercontent.com/dj-pearson/supabase-coolify-mcp-server/main/diagnose.ts
   
   # Or if you cloned the repo
   npm run diagnose
   ```

4. **Restart your MCP client**:
   - If using Claude Desktop: Restart the application
   - If using Cursor: Restart the editor
   - If using custom integration: Restart your MCP client

---

## 🔧 Upgrading Your MCP Configuration

### Claude Desktop

**Location**:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**No changes needed!** Your existing configuration will continue to work:

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://localhost:8000",
        "COOLIFY_API_TOKEN": "your-token",
        "SUPABASE_URL": "https://your-instance.example.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-key"
      }
    }
  }
}
```

### Cursor

**No changes needed!** If you're using npx, it automatically uses the latest version.

### Custom Integration

If you're running the server directly, update and rebuild:

```bash
npm update supabase-coolify-mcp-server
# Or if globally installed
npm update -g supabase-coolify-mcp-server
```

---

## ✅ Verify Upgrade

After upgrading, verify everything is working:

### 1. Check Version

```bash
# If globally installed
supabase-coolify-mcp --version

# If using npm scripts
npm run build
node dist/index.js --version
```

### 2. Test Connection (New in v1.2.0!)

```bash
# Run diagnostics
npm run diagnose

# Or use platform-specific scripts
# Windows:
.\diagnose.ps1

# Linux/Mac:
./diagnose.sh
```

Expected output:
```
🟢 ALL CHECKS PASSED - MCP Server should work correctly
```

### 3. Test MCP Tools

Start your MCP client and try a simple command:

```
"Run verify_setup to check the system health"
```

Or test a specific tool:

```
"List all Coolify applications"
```

---

## 🐛 Troubleshooting Upgrades

### Issue: "Command not found" after upgrade

**Cause**: npm global bin directory not in PATH

**Fix**:
```bash
# Find npm global bin directory
npm config get prefix

# Add to PATH (example for bash/zsh)
export PATH="$PATH:$(npm config get prefix)/bin"

# Or reinstall
npm install -g supabase-coolify-mcp-server
```

### Issue: "Old version still running"

**Cause**: Cached npm installation

**Fix**:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm uninstall -g supabase-coolify-mcp-server
npm install -g supabase-coolify-mcp-server
```

### Issue: "npx not fetching latest version"

**Cause**: npm cache

**Fix**:
```bash
# Clear npx cache
npx clear-npx-cache

# Or force latest
npx -y supabase-coolify-mcp-server@latest
```

### Issue: "Diagnostic tools not found"

**Cause**: Upgrading from older version without diagnostic tools

**Fix**:

If you installed from source or want the diagnostic tools locally:

```bash
# Download diagnostic script
curl -o diagnose.ts https://raw.githubusercontent.com/dj-pearson/supabase-coolify-mcp-server/main/diagnose.ts

# Windows PowerShell:
curl -o diagnose.ps1 https://raw.githubusercontent.com/dj-pearson/supabase-coolify-mcp-server/main/diagnose.ps1

# Linux/Mac:
curl -o diagnose.sh https://raw.githubusercontent.com/dj-pearson/supabase-coolify-mcp-server/main/diagnose.sh
chmod +x diagnose.sh
```

Or clone the repository:
```bash
git clone https://github.com/dj-pearson/supabase-coolify-mcp-server.git
cd supabase-coolify-mcp-server
npm run diagnose
```

---

## 🆕 New Features Guide

### Using the Diagnostic Tool

v1.2.0 introduces comprehensive diagnostics:

```bash
# Run diagnostics
npm run diagnose

# Or platform-specific
.\diagnose.ps1    # Windows
./diagnose.sh     # Linux/Mac
```

The tool checks:
- ✅ Environment configuration
- ✅ Coolify connection
- ✅ Supabase connection
- ✅ Service health
- ✅ Network connectivity

### New Documentation

Access new guides:
- **START_HERE.md** - Quick start and diagnostics
- **DIAGNOSE_NOW.md** - Troubleshooting walkthrough
- **TROUBLESHOOTING.md** - Comprehensive guide

View online:
```bash
# In project directory
cat START_HERE.md
cat DIAGNOSE_NOW.md
cat TROUBLESHOOTING.md
```

Or visit: https://github.com/dj-pearson/supabase-coolify-mcp-server

---

## 📋 Version Compatibility

| Version | Node.js | Coolify | Supabase | Status |
|---------|---------|---------|----------|--------|
| 1.2.x | ≥18.0.0 | Any | Any | ✅ Current |
| 1.1.x | ≥18.0.0 | Any | Any | ✅ Supported |
| 1.0.x | ≥18.0.0 | Any | Any | ⚠️ Upgrade Recommended |

---

## 🔄 Rollback (If Needed)

If you need to rollback to a previous version:

### Rollback to v1.1.x

```bash
# Uninstall current version
npm uninstall -g supabase-coolify-mcp-server

# Install specific version
npm install -g supabase-coolify-mcp-server@1.1.0
```

### Rollback with NPX

Update your MCP configuration to use specific version:

```json
{
  "command": "npx",
  "args": ["-y", "supabase-coolify-mcp-server@1.1.0"]
}
```

---

## 📞 Getting Help

If you encounter issues during upgrade:

1. **Run diagnostics**:
   ```bash
   npm run diagnose
   ```

2. **Check the guides**:
   - [START_HERE.md](START_HERE.md)
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

3. **Create an issue**:
   - [GitHub Issues](https://github.com/dj-pearson/supabase-coolify-mcp-server/issues)
   - Include:
     - Current version: `supabase-coolify-mcp --version`
     - Diagnostic output: `npm run diagnose`
     - Error messages
     - OS and Node version

---

## 🎉 What's Next?

After upgrading:

1. ✅ Run diagnostics to verify setup
2. ✅ Test the new diagnostic tools
3. ✅ Review the new documentation
4. ✅ Restart your MCP client
5. ✅ Start using the enhanced features!

---

**Need Help?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or create an issue on GitHub.

**Upgrading from older versions?** No problem! The upgrade process is the same - just update to the latest version.

