#!/bin/bash
# MCP Server Wrapper - Loads .env and starts server
# Location: supabase-coolify-mcp-server/start-mcp.sh

# Change to script directory
cd "$(dirname "$0")"

# Load .env file
if [ -f .env ]; then
    # Read .env file, skip comments and empty lines, strip quotes
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove leading/trailing whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Remove surrounding quotes (both single and double)
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # Export the variable
        export "$key=$value"
    done < .env
fi

# Start the MCP server
node dist/index.js

