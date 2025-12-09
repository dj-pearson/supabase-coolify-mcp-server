# Quick Start Guide

[![npm version](https://img.shields.io/npm/v/supabase-coolify-mcp-server.svg)](https://www.npmjs.com/package/supabase-coolify-mcp-server)

Get up and running with the Supabase Coolify MCP Server in 5 minutes.

**[📦 NPM Package](https://www.npmjs.com/package/supabase-coolify-mcp-server)** • **[💻 GitHub](https://github.com/dj-pearson/supabase-coolify-mcp-server)**

## ⚡ Prerequisites

- Node.js 18+ installed
- A running Coolify instance
- Coolify API token
- Claude Desktop (or another MCP client)

## 🚀 5-Minute Setup

### Step 1: Install (< 1 minute)

**Option A: Use directly with npx (No Installation)**
```bash
# No installation needed! npx will download and run it
npx supabase-coolify-mcp-server
```

**Option B: Install globally**
```bash
npm install -g supabase-coolify-mcp-server
```

**Option C: From source**
```bash
git clone https://github.com/dj-pearson/supabase-coolify-mcp-server.git
cd supabase-coolify-mcp-server
npm install
npm run build
```

### Step 2: Get Your API Tokens (2 minutes)

#### Coolify Token

1. Open your Coolify instance
2. Go to **Keys & Tokens** → **API Tokens**
3. Click **Create New Token**
4. Copy the token (save it somewhere safe!)

#### Supabase Keys (if you already have Supabase)

From your Supabase dashboard:
- **Settings** → **API** → Copy `service_role` key

Or skip this if you're deploying a new instance.

### Step 3: Configure Claude Desktop (2 minutes)

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "npx",
      "args": ["-y", "supabase-coolify-mcp-server"],
      "env": {
        "COOLIFY_API_URL": "https://your-coolify-instance.com",
        "COOLIFY_API_TOKEN": "your-coolify-api-token-here"
      }
    }
  }
}
```

**If using global installation:**
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "supabase-coolify-mcp",
      "env": {
        "COOLIFY_API_URL": "https://your-coolify-instance.com",
        "COOLIFY_API_TOKEN": "your-coolify-api-token-here"
      }
    }
  }
}
```

**Note:** If you already have Supabase, also add these environment variables:
```json
"SUPABASE_URL": "https://your-supabase.com",
"SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
```

### Step 4: Restart Claude Desktop (< 1 minute)

Close and reopen Claude Desktop.

### Step 5: Test It! (< 1 minute)

In Claude, try asking:

> "List all my Coolify applications"

or

> "Deploy a new Supabase instance on Coolify named 'test-supabase'"

✅ **Done!** You're ready to use the MCP server.

## 📖 Common First Tasks

### Deploy Your First Supabase Instance

Ask Claude:

> "Deploy a new Supabase instance on Coolify with these settings:
> - Name: my-first-supabase
> - Enable realtime, storage, and auth
> - Use PostgreSQL 15"

The server will:
1. Create the Coolify application
2. Set up all Supabase services
3. Generate secure passwords and keys
4. Return your credentials

**Important:** Save the credentials that are returned!

### Deploy Your First Migration (with Rollback Support!)

Ask Claude:

> "Create a migration with rollback support for a profiles table with columns: id (uuid), username (text), created_at (timestamp). Enable RLS and allow public reads."

This will create a migration that can be safely rolled back if needed!

### Deploy Your First Edge Function

Ask Claude:

> "Deploy an edge function called 'hello' that returns a JSON response with message 'Hello World'"

### Check System Health

Ask Claude:

> "Check the health of all Supabase services"

### Use Supabase CLI

Ask Claude:

> "Initialize a new Supabase project and start the local development environment"

or

> "Generate TypeScript types from my database schema"

## 🎯 Example Conversation with Claude

**You:** "I need to deploy a new Supabase instance for my blog application"

**Claude:** *Uses deploy_supabase_to_coolify tool*

**Claude:** "I've deployed a new Supabase instance! Here are your credentials..."

**You:** "Now create a posts table with title, content, and author_id columns"

**Claude:** *Uses deploy_migration tool*

**Claude:** "The posts table has been created with RLS enabled..."

**You:** "Add an edge function to send email notifications when someone posts"

**Claude:** *Uses deploy_edge_function tool*

**Claude:** "I've deployed the email notification function..."

## 🔧 Troubleshooting

### "MCP server not found"

- Check that you saved the config file
- Restart Claude Desktop
- Verify the JSON syntax is correct

### "Missing required environment variables"

- Make sure `COOLIFY_API_URL` and `COOLIFY_API_TOKEN` are set
- Check for typos in environment variable names

### "Connection failed"

- Verify your Coolify instance is accessible
- Check that the API token is valid
- Ensure the URL includes `http://` or `https://`

### Need More Help?

- Read the full [README.md](./README.md)
- Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Review [examples/](./examples/)
- Open an issue on GitHub

## 🎓 Next Steps

Now that you're set up:

1. **Learn the tools** - See [README.md](./README.md#available-tools) for all available tools

2. **Read examples** - Check [examples/deployment-example.md](./examples/deployment-example.md)

3. **Learn about rollbacks** - See [docs/MIGRATION_ROLLBACK.md](./docs/MIGRATION_ROLLBACK.md) for safe migration management

4. **Use the Supabase CLI** - Check [docs/SUPABASE_CLI.md](./docs/SUPABASE_CLI.md) for CLI integration

5. **Understand the architecture** - Read [ARCHITECTURE.md](./ARCHITECTURE.md)

6. **Deploy to production** - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

7. **Contribute** - See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 💡 Tips for Using with Claude

### Be Specific

❌ "Set up a database"  
✅ "Deploy a Supabase instance on Coolify named 'production-db' with PostgreSQL 15, realtime, and storage enabled"

### Ask for Status

"What's the status of my Supabase deployment?"  
"Show me the recent logs for application uuid-123"  
"Check if all services are healthy"

### Request Multiple Actions

"Deploy a users table with RLS, create a storage bucket called 'avatars', and deploy an edge function to resize images"

### Get Explanations

"Explain what environment variables are needed for Supabase auth"  
"What migrations have been deployed?"  
"Show me all my edge functions and their status"

## 🌟 Advanced Usage

### Using Environment Files

Instead of putting credentials in Claude's config, use a `.env` file:

```env
COOLIFY_API_URL=https://coolify.example.com
COOLIFY_API_TOKEN=your-token
SUPABASE_URL=https://supabase.example.com
SUPABASE_SERVICE_ROLE_KEY=your-key
```

Then in Claude config:
```json
{
  "mcpServers": {
    "supabase-coolify": {
      "command": "bash",
      "args": ["-c", "source ~/.env && npx supabase-coolify-mcp-server --yes"]
    }
  }
}
```

### Running Multiple Instances

Manage multiple Supabase instances by creating different config entries:

```json
{
  "mcpServers": {
    "production-supabase": {
      "command": "npx",
      "args": ["supabase-coolify-mcp-server", "--yes"],
      "env": {
        "COOLIFY_API_URL": "https://coolify.example.com",
        "COOLIFY_API_TOKEN": "prod-token",
        "SUPABASE_URL": "https://prod.supabase.example.com",
        "SUPABASE_SERVICE_ROLE_KEY": "prod-key"
      }
    },
    "staging-supabase": {
      "command": "npx",
      "args": ["supabase-coolify-mcp-server", "--yes"],
      "env": {
        "COOLIFY_API_URL": "https://coolify.example.com",
        "COOLIFY_API_TOKEN": "staging-token",
        "SUPABASE_URL": "https://staging.supabase.example.com",
        "SUPABASE_SERVICE_ROLE_KEY": "staging-key"
      }
    }
  }
}
```

### Development Mode

For development, run the server directly:

```bash
# Set environment variables
export COOLIFY_API_URL="http://localhost:8000"
export COOLIFY_API_TOKEN="your-token"

# Run in development mode
npm run dev
```

## 📞 Get Help

- **GitHub Issues:** Report bugs or ask questions
- **Documentation:** Full docs in [README.md](./README.md)
- **Examples:** See [examples/](./examples/) directory
- **Discord/Community:** (Add your community links here)

---

**Ready to build?** Start by deploying your first Supabase instance! 🚀

