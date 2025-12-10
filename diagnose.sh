#!/bin/bash
# Diagnostic Script for Linux/Mac
# Quick helper to diagnose MCP connection issues

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🔍 Supabase Coolify MCP Server - Quick Diagnostics${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if .env exists
echo -e "${YELLOW}Checking for .env file...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
    echo ""
else
    echo -e "${RED}❌ .env file NOT found!${NC}"
    echo ""
    echo -e "${YELLOW}Creating .env from env.example...${NC}"
    
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  You need to edit .env and add your actual credentials!${NC}"
        echo -e "${CYAN}   Run: nano .env${NC}"
        echo -e "${CYAN}   Or:  vim .env${NC}"
        echo ""
        read -p "Press enter to open .env in nano..."
        nano .env
        echo ""
        echo -e "${YELLOW}After you've filled in your credentials, run this script again.${NC}"
        echo ""
        exit
    else
        echo -e "${RED}❌ env.example not found either!${NC}"
        echo -e "${YELLOW}   Make sure you're in the project directory.${NC}"
        exit 1
    fi
fi

# Quick check of .env contents
echo -e "${YELLOW}Checking .env configuration...${NC}"

hasPlaceholder=false
if grep -q "your-coolify-api-token-here\|your-supabase-instance.example.com\|your-supabase-service-role-key" .env; then
    echo -e "${YELLOW}⚠️  Found placeholder values in .env!${NC}"
    echo -e "${YELLOW}   You need to replace them with actual credentials.${NC}"
    hasPlaceholder=true
fi

# Check for required variables
echo ""
echo -e "${YELLOW}Required environment variables:${NC}"

check_var() {
    local var_name=$1
    if grep -q "^${var_name}=" .env; then
        local value=$(grep "^${var_name}=" .env | cut -d'=' -f2- | xargs)
        if [ -n "$value" ]; then
            local masked="${value:0:10}..."
            echo -e "  ${GREEN}✅ ${var_name} = ${masked}${NC}"
        else
            echo -e "  ${RED}❌ ${var_name} is empty!${NC}"
        fi
    else
        echo -e "  ${RED}❌ ${var_name} not found!${NC}"
    fi
}

check_var "COOLIFY_API_URL"
check_var "COOLIFY_API_TOKEN"
check_var "SUPABASE_URL"
check_var "SUPABASE_SERVICE_ROLE_KEY"

echo ""

if [ "$hasPlaceholder" = true ]; then
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  ACTION REQUIRED${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Your .env file has placeholder values. You need to:${NC}"
    echo ""
    echo -e "${CYAN}1. Get your Coolify API token:${NC}"
    echo -e "   ${NC}- Log into Coolify${NC}"
    echo -e "   ${NC}- Go to: Keys & Tokens → API Tokens${NC}"
    echo -e "   ${NC}- Create New Token${NC}"
    echo ""
    echo -e "${CYAN}2. Get your Supabase service role key:${NC}"
    echo -e "   ${NC}- Go to: https://app.supabase.com${NC}"
    echo -e "   ${NC}- Select your project → Settings → API${NC}"
    echo -e "   ${NC}- Copy the SERVICE ROLE key (not anon key!)${NC}"
    echo ""
    echo -e "${CYAN}3. Update your .env file with these values${NC}"
    echo ""
    
    read -p "Open .env in editor now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        else
            echo -e "${YELLOW}Please edit .env with your preferred editor${NC}"
        fi
        echo ""
        echo -e "${YELLOW}After saving your changes, run this script again.${NC}"
        echo ""
    fi
    exit
fi

# Check if Node.js and npm are installed
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    nodeVersion=$(node --version)
    echo -e "${GREEN}✅ Node.js ${nodeVersion} installed${NC}"
else
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo -e "${YELLOW}   Install Node.js from: https://nodejs.org/${NC}"
    exit 1
fi

# Check if node_modules exists
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo -e "${CYAN}   Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Run the TypeScript diagnostic tool
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Running full diagnostic suite...${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

npm run diagnose

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Diagnostics complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📖 For detailed troubleshooting, see:${NC}"
echo -e "${CYAN}   - DIAGNOSE_NOW.md (quick start)${NC}"
echo -e "${CYAN}   - TROUBLESHOOTING.md (comprehensive guide)${NC}"
echo ""

