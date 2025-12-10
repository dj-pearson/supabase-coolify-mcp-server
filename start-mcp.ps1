#!/usr/bin/env pwsh
# MCP Server Wrapper - Loads .env and starts server
# Location: c:\Users\pears\Documents\Coolify\supabase-coolify-mcp-server\start-mcp.ps1

# Change to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Load .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
}

# Start the MCP server
& node dist/index.js

