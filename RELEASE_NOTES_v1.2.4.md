# 🐛 v1.2.4 - Self-Hosted Supabase Compatibility Fixes

## Overview

This release fixes critical bugs in REST API-based tools that were failing on self-hosted Supabase instances. These fixes improve reliability and provide clear guidance to users when certain features are unavailable.

---

## 🔧 Bug Fixes

### 1. Fixed `deploy_migration` Tool

**Issue:** Tool was calling non-existent `exec_sql` RPC function, causing "Unknown error"

**Solution:**

- Gracefully handles missing RPC functions
- Provides clear error messages when SQL execution fails
- Guides users to use CLI tools instead: `supabase_migration_new` + `supabase_db_push`
- Records migration metadata even when automatic execution fails

### 2. Fixed `execute_sql` Tool

**Issue:** Tool was calling non-existent `/rest/v1/rpc/exec_sql` endpoint, showing "Missing required database function"

**Solution:**

- Attempts RPC execution first
- On failure, provides helpful alternatives:
  - Supabase CLI: `supabase db execute --file your-file.sql`
  - Supabase Dashboard SQL Editor
  - Direct psql connection
- Clear error messages explaining why it failed

### 3. Fixed `list_edge_functions` Tool

**Issue:** Using incorrect endpoint causing authentication errors

**Solution:**

- Now uses proper Edge Functions API endpoint
- Better error handling with status code detection
- Detects when Edge Functions are not configured/enabled on self-hosted
- Guides users to use `supabase_functions_list` CLI tool

---

## 📚 Documentation Improvements

### Updated Tool Descriptions

All affected tools now include prominent **NOTE** sections guiding users:

```
deploy_migration: "NOTE: For self-hosted Supabase, consider using
                  supabase_migration_new + supabase_db_push for better reliability."

execute_sql: "NOTE: For self-hosted Supabase, use supabase_cli_execute
             with 'db execute' for better reliability."
```

### Enhanced MCP Configuration Documentation

- Emphasized **MCP config `env` section** as the primary scalable configuration method
- Added user type recommendations table
- Clarified that MCP config works for all installation types (npx, global, local)

---

## 🎯 Why These Changes Matter

### Self-Hosted vs Managed Supabase

Self-hosted Supabase has different capabilities than managed Supabase:

| Feature        | Managed Supabase | Self-Hosted               |
| -------------- | ---------------- | ------------------------- |
| REST API       | Full featured    | Limited endpoints         |
| RPC Functions  | Pre-configured   | Must be created manually  |
| Edge Functions | Built-in         | Requires additional setup |
| CLI Tools      | ✅ Works         | ✅ **Most Reliable**      |

### Recommended Tool Usage

For **self-hosted Supabase**, prefer CLI tools over REST API tools:

✅ **Use These (CLI Tools):**

- `supabase_migration_new` + `supabase_db_push`
- `supabase_cli_execute`
- `supabase_functions_deploy`
- `supabase_functions_list`

⚠️ **These May Fail (REST API Tools):**

- `deploy_migration` - Use CLI instead
- `execute_sql` - Use CLI instead
- `list_edge_functions` - Use CLI instead

---

## 📦 Installation

### NPX (Recommended - Always Latest)

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "http://your-coolify-url:8000",
        "COOLIFY_API_TOKEN": "your-actual-token",
        "SUPABASE_URL": "https://your-supabase-url.com",
        "SUPABASE_SERVICE_ROLE_KEY": "your-actual-key"
      }
    }
  }
}
```

### Global Install

```bash
npm install -g supabase-coolify-mcp-server@1.2.4
```

---

## 🔧 Configuration Priority

Environment variables are loaded in this order:

1. **MCP config `env` section** (Highest Priority) ⭐ **RECOMMENDED**
2. **System environment variables** (Medium Priority)
3. **`.env` file** (Lowest Priority - development only)

**Important:** MCP config is the only truly scalable method for distribution!

---

## 🐛 Known Limitations

### Self-Hosted Supabase

Some REST API endpoints are not available or require manual setup:

- **Migrations:** May need manual SQL execution via dashboard or CLI
- **Edge Functions:** Require additional configuration and setup
- **Direct SQL:** Limited to specific RPC functions

**Solution:** Use the Supabase CLI tools provided by this MCP server for maximum compatibility.

---

## 📖 Full Documentation

- [MCP Configuration Guide](https://github.com/dj-pearson/supabase-coolify-mcp-server/blob/main/MCP_CONFIGURATION.md)
- [Troubleshooting Guide](https://github.com/dj-pearson/supabase-coolify-mcp-server/blob/main/TROUBLESHOOTING.md)
- [Supabase CLI Tools](https://github.com/dj-pearson/supabase-coolify-mcp-server/blob/main/docs/SUPABASE_CLI.md)

---

## 🔄 Upgrading from v1.2.3

### NPX Users (No Action Needed)

If using `npx` in your MCP config, you'll automatically get v1.2.4 on next restart.

### Global Install Users

```bash
npm install -g supabase-coolify-mcp-server@1.2.4
```

### What's Changed

- Better error handling for self-hosted Supabase
- Clearer error messages with actionable guidance
- No breaking changes to existing functionality

---

## 🙏 Feedback

If you encounter issues with self-hosted Supabase:

1. Check the error message for suggested CLI tool alternatives
2. Verify your environment variables are set in MCP config
3. See [TROUBLESHOOTING.md](https://github.com/dj-pearson/supabase-coolify-mcp-server/blob/main/TROUBLESHOOTING.md)
4. Open an issue on GitHub

---

## 📊 What's Next

Future improvements planned:

- Auto-detection of self-hosted vs managed Supabase
- Automatic fallback to CLI tools when REST API unavailable
- Enhanced Edge Functions setup wizard
- More comprehensive health checks

---

**Full Changelog:** [CHANGELOG.md](https://github.com/dj-pearson/supabase-coolify-mcp-server/blob/main/CHANGELOG.md)

**npm Package:** https://www.npmjs.com/package/supabase-coolify-mcp-server
