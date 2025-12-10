# 🚀 START HERE - Diagnose Your MCP Connection

## What I've Created For You

I've created a comprehensive diagnostic system to help you identify and fix the connection issues with your Supabase Coolify MCP server. Here's what's now available:

### 📁 New Files Created:

1. **`diagnose.ts`** - Automated diagnostic tool (TypeScript)
2. **`diagnose.ps1`** - Quick diagnostic script for Windows
3. **`diagnose.sh`** - Quick diagnostic script for Linux/Mac
4. **`DIAGNOSE_NOW.md`** - Quick start troubleshooting guide
5. **`TROUBLESHOOTING.md`** - Comprehensive troubleshooting guide
6. **`START_HERE.md`** - This file!

---

## 🔥 Run This RIGHT NOW

Choose your operating system:

### Windows (PowerShell)
```powershell
.\diagnose.ps1
```

### Linux/Mac
```bash
chmod +x diagnose.sh
./diagnose.sh
```

### Or use npm directly (any OS)
```bash
npm run diagnose
```

---

## 🎯 What The Diagnostic Tool Checks

The diagnostic tool will automatically check:

✅ **Environment File**
- Does `.env` file exist?
- Are required variables set?
- Are there placeholder values that need replacing?

✅ **Coolify Connection**
- Can it reach your Coolify instance?
- Is the API token valid?
- Can it authenticate successfully?

✅ **Supabase Connection**
- Can it reach your Supabase instance?
- Is the service role key valid?
- Can it query the database?
- Are all services (Auth, Storage, Realtime) healthy?

✅ **Network**
- Is internet connectivity working?
- Are there any firewall issues?

---

## 🔍 What You'll See

### ✅ If Everything Works:
```
🟢 ALL CHECKS PASSED - MCP Server should work correctly

✅ Passed:   10
❌ Failed:   0
⚠️  Warnings: 0
```

### ❌ If There Are Issues:
The diagnostic tool will tell you EXACTLY what's wrong and HOW to fix it:

```
❌ ENV: COOLIFY_API_TOKEN
   Status: fail
   Message: Contains placeholder value
   💡 Suggestion: Replace placeholder with actual value
```

---

## 🛠️ Most Common Issues & Quick Fixes

### Issue 1: Missing .env File

**You'll see**: `❌ .env file NOT found!`

**Fix**:
```bash
# Windows
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```
Then edit `.env` and fill in your credentials.

---

### Issue 2: Placeholder Values in .env

**You'll see**: `❌ Contains placeholder value`

**Fix**: Edit your `.env` file and replace these:

```env
# ❌ WRONG (placeholders):
COOLIFY_API_TOKEN=your-coolify-api-token-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ✅ CORRECT (actual values):
COOLIFY_API_TOKEN=clf_abc123def456...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Issue 3: Using Wrong Supabase Key

**You'll see**: `❌ Invalid service role key` or `401 JWT error`

**The Problem**: You're probably using the **anon key** instead of **service role key**.

**Fix**: Get the correct key:

1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy the **`service_role`** key ⬅️ **THIS ONE**
5. NOT the `anon` key!

---

### Issue 4: Invalid Coolify Token

**You'll see**: `❌ Invalid API token` or `401 Unauthorized`

**Fix**: Generate a new token:

1. Log into Coolify
2. Profile → Keys & Tokens → API Tokens
3. Create New Token
4. Name it "MCP Server"
5. Copy the token (you won't see it again!)
6. Paste into `.env` as `COOLIFY_API_TOKEN`

---

## 📋 Required Environment Variables

Make sure your `.env` has these 4 REQUIRED variables:

```env
# 1. Coolify API URL
COOLIFY_API_URL=https://coolify.yourdomain.com
# or http://localhost:8000 if running locally

# 2. Coolify API Token
COOLIFY_API_TOKEN=clf_your_actual_token_here

# 3. Supabase URL
SUPABASE_URL=https://yourproject.supabase.co
# NO trailing slash!

# 4. Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...very_long_token...
# Must be SERVICE ROLE key, not anon key!
```

---

## ⚡ Quick Action Plan

1. **Run diagnostics** (choose one):
   ```bash
   npm run diagnose           # Any OS
   .\diagnose.ps1            # Windows
   ./diagnose.sh             # Linux/Mac
   ```

2. **Read the output** - it will tell you exactly what's wrong

3. **Fix the issues** - follow the suggestions in the output

4. **Run diagnostics again** to verify fixes

5. **Start the MCP server**:
   ```bash
   npm run dev
   ```

6. **Use the verify_setup tool** in Cursor for final confirmation

---

## 📚 More Help

- **Quick Start**: See `DIAGNOSE_NOW.md`
- **Detailed Troubleshooting**: See `TROUBLESHOOTING.md`
- **Environment Setup**: See `env.example`

---

## 🆘 Still Having Issues?

After running diagnostics, if you're still stuck:

1. **Check the detailed error messages** in the diagnostic output
2. **Read TROUBLESHOOTING.md** for in-depth solutions
3. **Create an issue** on GitHub with:
   - Full output from `npm run diagnose`
   - Your operating system
   - What you've already tried

---

## 🔐 Security Reminder

⚠️ **NEVER** commit your `.env` file to version control!

⚠️ **NEVER** share your API tokens or service role keys!

⚠️ When asking for help, **mask** your credentials in logs!

---

## ✨ Next Steps After Fixing

Once diagnostics pass:

1. ✅ Start the MCP server: `npm run dev`
2. ✅ Open Cursor and verify MCP is connected
3. ✅ Run the `verify_setup` tool for a full health check
4. ✅ Start using the MCP tools!

---

## 💡 Pro Tips

- **Save your credentials** in a password manager
- **Rotate tokens regularly** for security
- **Test manually** if needed (see TROUBLESHOOTING.md)
- **Keep .env in .gitignore** (already done)

---

## 🎯 Summary

**You need to**:
1. Run the diagnostic tool (see commands above)
2. Follow the suggestions it gives you
3. Fix your `.env` configuration
4. Run diagnostics again until it passes

**The diagnostic tool will guide you through everything!**

---

**Ready? Run the diagnostic tool now!** 🚀

```bash
npm run diagnose
```

