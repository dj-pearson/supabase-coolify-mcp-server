#!/bin/bash
# MCP Server Wrapper - Loads .env and starts server
# Location: supabase-coolify-mcp-server/start-mcp.sh

# Change to script directory
cd "$(dirname "$0")"

# Load .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Start the MCP server
node dist/index.js

