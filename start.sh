#!/usr/bin/env bash
# =============================================================================
# PathPilot — Linux / macOS Launcher
# Usage: chmod +x start.sh && ./start.sh
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       PathPilot: Career Execution OS — Launcher      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Check Docker ─────────────────────────────────────────────────────
echo -e "[1/6] ${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running or not installed.${NC}"
    echo "  Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo -e "      ${GREEN}✓ Docker is running${NC}"

# ── Step 2: Check Docker Compose v2 ─────────────────────────────────────────
echo ""
echo -e "[2/6] ${YELLOW}Checking Docker Compose...${NC}"
if ! docker compose version > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker Compose v2 not found. Update Docker Desktop.${NC}"
    exit 1
fi
echo -e "      ${GREEN}✓ Docker Compose v2 available${NC}"

# ── Step 3: Set up .env files ────────────────────────────────────────────────
echo ""
echo -e "[3/6] ${YELLOW}Setting up environment files...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "      ${GREEN}✓ Created root .env from .env.example${NC}"
    else
        echo -e "${RED}ERROR: .env.example not found.${NC}"
        exit 1
    fi
else
    echo -e "      ${GREEN}✓ Root .env already exists${NC}"
fi

if [ ! -f "backend/.env" ]; then
    [ -f "backend/.env.example" ] && cp backend/.env.example backend/.env
    echo -e "      ${GREEN}✓ Created backend/.env${NC}"
else
    echo -e "      ${GREEN}✓ backend/.env already exists${NC}"
fi

# ── Step 4: Collect API keys ─────────────────────────────────────────────────
echo ""
echo -e "[4/6] ${YELLOW}Configuring API keys...${NC}"

# Groq
GROQ_CURRENT=$(grep "^GROQ_API_KEY=" .env | cut -d'=' -f2-)
if [ -z "$GROQ_CURRENT" ]; then
    echo ""
    echo -e "  ${CYAN}┌─────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${CYAN}│  OPTIONAL: Groq API Key (AI Chat + Roadmap Gen)     │${NC}"
    echo -e "  ${CYAN}│  Free key at: https://console.groq.com              │${NC}"
    echo -e "  ${CYAN}│  Press ENTER to skip                                │${NC}"
    echo -e "  ${CYAN}└─────────────────────────────────────────────────────┘${NC}"
    read -r -p "  Groq API Key: " GROQ_KEY
    if [ -n "$GROQ_KEY" ]; then
        sed -i.bak "s|^GROQ_API_KEY=.*|GROQ_API_KEY=$GROQ_KEY|" .env && rm -f .env.bak
        echo -e "      ${GREEN}✓ Groq API key saved${NC}"
    else
        echo -e "      Skipped Groq key."
    fi
fi

# Gemini
GEMINI_CURRENT=$(grep "^GEMINI_API_KEY=" .env | cut -d'=' -f2-)
if [ -z "$GEMINI_CURRENT" ]; then
    echo ""
    echo -e "  ${CYAN}┌─────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${CYAN}│  OPTIONAL: Gemini API Key (Roadmap Generation)      │${NC}"
    echo -e "  ${CYAN}│  Free key: https://aistudio.google.com/app/apikey   │${NC}"
    echo -e "  ${CYAN}│  Press ENTER to skip                                │${NC}"
    echo -e "  ${CYAN}└─────────────────────────────────────────────────────┘${NC}"
    read -r -p "  Gemini API Key: " GEMINI_KEY
    if [ -n "$GEMINI_KEY" ]; then
        sed -i.bak "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|" .env && rm -f .env.bak
        echo -e "      ${GREEN}✓ Gemini API key saved${NC}"
    else
        echo -e "      Skipped Gemini key."
    fi
fi

echo -e "      ${GREEN}✓ Environment ready${NC}"

# ── Step 5: Build and start ───────────────────────────────────────────────────
echo ""
echo -e "[5/6] ${YELLOW}Building and starting all services...${NC}"
echo -e "      NOTE: First run takes 5-15 minutes (downloads ~2GB of images)."
echo ""
docker compose up -d --build
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to start services. Check logs:${NC}"
    echo "  docker compose logs --tail=100"
    exit 1
fi

# ── Step 6: Wait for health ───────────────────────────────────────────────────
echo ""
echo -e "[6/6] ${YELLOW}Waiting for PathPilot to become ready...${NC}"
echo -e "      (First run: up to 3 minutes while ML models load into memory)"
echo ""

COUNTER=0
MAX_WAIT=180
while [ $COUNTER -lt $MAX_WAIT ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        break
    fi
    printf "."
    sleep 2
    COUNTER=$((COUNTER + 2))
done

echo ""
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               PathPilot is LIVE!                     ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  App      :  http://localhost                        ║${NC}"
echo -e "${GREEN}║  API Docs :  http://localhost:8000/api/v1/docs       ║${NC}"
echo -e "${GREEN}║  Health   :  http://localhost:8000/health            ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Stop     :  docker compose down                     ║${NC}"
echo -e "${GREEN}║  Logs     :  docker compose logs -f                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Open browser (works on macOS; skip silently on Linux headless)
if command -v open &>/dev/null; then
    open http://localhost
elif command -v xdg-open &>/dev/null; then
    xdg-open http://localhost &>/dev/null &
fi
