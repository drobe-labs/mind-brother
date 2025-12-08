#!/bin/bash

# =============================================================================
# Mind Brother - Complete Health Check & Reset Script
# =============================================================================
# This script will:
# 1. Clear all caches (npm, build artifacts, temp files)
# 2. Reinstall dependencies
# 3. Test API connections (Anthropic Claude & ElevenLabs)
# 4. Run health checks on backend and frontend
# 5. Start servers with proper configuration
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis for better readability
CHECK="✅"
CROSS="❌"
WARN="⚠️"
INFO="ℹ️"
ROCKET="🚀"
CLEAN="🧹"
TEST="🧪"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Mind Brother - Complete Health Check & Reset${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =============================================================================
# STEP 1: Detect Computer IP Address
# =============================================================================
echo -e "${INFO} ${BLUE}Detecting your computer's IP address...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    COMPUTER_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    COMPUTER_IP=$(hostname -I | awk '{print $1}')
else
    # Windows (Git Bash or WSL)
    COMPUTER_IP=$(ipconfig | grep "IPv4" | awk '{print $NF}' | head -1)
fi

if [ -z "$COMPUTER_IP" ]; then
    echo -e "${CROSS} ${RED}Could not detect IP address. Please check your network connection.${NC}"
    exit 1
fi

echo -e "${CHECK} ${GREEN}Computer IP: ${COMPUTER_IP}${NC}"
echo ""

# =============================================================================
# STEP 2: Kill Any Running Servers
# =============================================================================
echo -e "${CLEAN} ${YELLOW}Killing any running servers on ports 3001 and 5173...${NC}"

# Kill backend (port 3001)
if lsof -ti:3001 > /dev/null 2>&1; then
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    echo -e "${CHECK} ${GREEN}Killed process on port 3001${NC}"
else
    echo -e "${INFO} No process running on port 3001${NC}"
fi

# Kill frontend (port 5173)
if lsof -ti:5173 > /dev/null 2>&1; then
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    echo -e "${CHECK} ${GREEN}Killed process on port 5173${NC}"
else
    echo -e "${INFO} No process running on port 5173${NC}"
fi

echo ""

# =============================================================================
# STEP 3: Clear All Caches
# =============================================================================
echo -e "${CLEAN} ${YELLOW}Clearing all caches and build artifacts...${NC}"

# Clear npm cache
echo -e "${INFO} Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Clear node_modules in root
if [ -d "node_modules" ]; then
    echo -e "${INFO} Removing root node_modules..."
    rm -rf node_modules
fi

# Clear node_modules in backend
if [ -d "backend/node_modules" ]; then
    echo -e "${INFO} Removing backend node_modules..."
    rm -rf backend/node_modules
fi

# Clear build artifacts
echo -e "${INFO} Clearing build artifacts..."
rm -rf dist/ build/ .vite/ .turbo/ 2>/dev/null || true
rm -rf backend/dist/ backend/build/ 2>/dev/null || true

# Clear OS caches
echo -e "${INFO} Clearing system temporary files..."
rm -rf .DS_Store **/.DS_Store 2>/dev/null || true

echo -e "${CHECK} ${GREEN}All caches cleared!${NC}"
echo ""

# =============================================================================
# STEP 4: Check Environment Files
# =============================================================================
echo -e "${TEST} ${YELLOW}Checking environment configuration...${NC}"

# Check backend .env
if [ ! -f "backend/.env" ]; then
    echo -e "${CROSS} ${RED}backend/.env file not found!${NC}"
    echo -e "${INFO} Creating backend/.env template..."
    cat > backend/.env << 'EOF'
# Anthropic API Key (Required)
ANTHROPIC_API_KEY=your_key_here

# ElevenLabs API Key (Optional - for voice features)
ELEVENLABS_API_KEY=your_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
EOF
    echo -e "${WARN} ${YELLOW}Please add your API keys to backend/.env${NC}"
    exit 1
else
    echo -e "${CHECK} ${GREEN}backend/.env exists${NC}"
fi

# Check for API keys
if ! grep -q "ANTHROPIC_API_KEY=sk-" backend/.env 2>/dev/null; then
    echo -e "${WARN} ${YELLOW}ANTHROPIC_API_KEY may not be set in backend/.env${NC}"
fi

if ! grep -q "ELEVENLABS_API_KEY=" backend/.env 2>/dev/null; then
    echo -e "${INFO} ELEVENLABS_API_KEY not found (optional)${NC}"
fi

# Check/Create frontend .env
if [ ! -f ".env" ]; then
    echo -e "${INFO} Creating frontend .env file..."
    echo "VITE_BACKEND_URL=http://${COMPUTER_IP}:3001" > .env
    echo -e "${CHECK} ${GREEN}Created .env with VITE_BACKEND_URL=http://${COMPUTER_IP}:3001${NC}"
else
    # Update existing .env with correct IP
    if grep -q "VITE_BACKEND_URL=" .env; then
        sed -i.bak "s|VITE_BACKEND_URL=.*|VITE_BACKEND_URL=http://${COMPUTER_IP}:3001|g" .env
        rm -f .env.bak
        echo -e "${CHECK} ${GREEN}Updated .env with correct IP${NC}"
    else
        echo "VITE_BACKEND_URL=http://${COMPUTER_IP}:3001" >> .env
        echo -e "${CHECK} ${GREEN}Added VITE_BACKEND_URL to .env${NC}"
    fi
fi

echo ""

# =============================================================================
# STEP 5: Reinstall Dependencies
# =============================================================================
echo -e "${ROCKET} ${YELLOW}Installing dependencies...${NC}"

# Install root dependencies
echo -e "${INFO} Installing root dependencies..."
npm install

# Install backend dependencies
echo -e "${INFO} Installing backend dependencies..."
cd backend
npm install
cd ..

echo -e "${CHECK} ${GREEN}All dependencies installed!${NC}"
echo ""

# =============================================================================
# STEP 6: Test API Keys
# =============================================================================
echo -e "${TEST} ${YELLOW}Testing API connections...${NC}"

# Load environment variables
if [ -f backend/.env ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

# Test Anthropic API
if [ ! -z "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "your_key_here" ]; then
    echo -e "${INFO} Testing Anthropic Claude API..."
    
    ANTHROPIC_TEST=$(curl -s -w "%{http_code}" -o /tmp/anthropic_test.json \
        https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d '{
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "Hi"}]
        }')
    
    if [ "$ANTHROPIC_TEST" == "200" ]; then
        echo -e "${CHECK} ${GREEN}Anthropic API: Connected successfully!${NC}"
    else
        echo -e "${CROSS} ${RED}Anthropic API: Failed (HTTP $ANTHROPIC_TEST)${NC}"
        if [ -f /tmp/anthropic_test.json ]; then
            echo -e "${INFO} Error details: $(cat /tmp/anthropic_test.json)"
        fi
    fi
else
    echo -e "${WARN} ${YELLOW}Anthropic API key not configured${NC}"
fi

# Test ElevenLabs API
if [ ! -z "$ELEVENLABS_API_KEY" ] && [ "$ELEVENLABS_API_KEY" != "your_key_here" ]; then
    echo -e "${INFO} Testing ElevenLabs API..."
    
    ELEVENLABS_TEST=$(curl -s -w "%{http_code}" -o /tmp/elevenlabs_test.json \
        https://api.elevenlabs.io/v1/user \
        -H "xi-api-key: $ELEVENLABS_API_KEY")
    
    if [ "$ELEVENLABS_TEST" == "200" ]; then
        echo -e "${CHECK} ${GREEN}ElevenLabs API: Connected successfully!${NC}"
    else
        echo -e "${CROSS} ${RED}ElevenLabs API: Failed (HTTP $ELEVENLABS_TEST)${NC}"
    fi
else
    echo -e "${INFO} ElevenLabs API key not configured (optional)${NC}"
fi

echo ""

# =============================================================================
# STEP 7: Run TypeScript Checks
# =============================================================================
echo -e "${TEST} ${YELLOW}Running TypeScript checks...${NC}"

# Check if TypeScript is available
if command -v tsc &> /dev/null; then
    echo -e "${INFO} Checking TypeScript files..."
    
    # Run TypeScript check
    if npm run type-check 2>/dev/null || npx tsc --noEmit 2>/dev/null; then
        echo -e "${CHECK} ${GREEN}TypeScript: No errors found!${NC}"
    else
        echo -e "${WARN} ${YELLOW}TypeScript: Some errors found (non-blocking)${NC}"
    fi
else
    echo -e "${INFO} TypeScript not configured, skipping...${NC}"
fi

echo ""

# =============================================================================
# STEP 8: Start Backend Server
# =============================================================================
echo -e "${ROCKET} ${YELLOW}Starting backend server...${NC}"

cd backend

# Start backend in background
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${INFO} Backend starting (PID: $BACKEND_PID)..."
echo -e "${INFO} Waiting for backend to be ready..."

# Wait for backend to start (max 10 seconds)
for i in {1..20}; do
    sleep 0.5
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${CHECK} ${GREEN}Backend is running on http://localhost:3001${NC}"
        echo -e "${CHECK} ${GREEN}Backend accessible at http://${COMPUTER_IP}:3001${NC}"
        break
    fi
    
    if [ $i -eq 20 ]; then
        echo -e "${CROSS} ${RED}Backend failed to start within 10 seconds${NC}"
        echo -e "${INFO} Check backend.log for details"
        tail -20 ../backend.log
        exit 1
    fi
done

cd ..

echo ""

# =============================================================================
# STEP 9: Health Check Backend Endpoints
# =============================================================================
echo -e "${TEST} ${YELLOW}Testing backend endpoints...${NC}"

# Test health endpoint
HEALTH_STATUS=$(curl -s http://localhost:3001/health)
if [ "$HEALTH_STATUS" == "OK" ]; then
    echo -e "${CHECK} ${GREEN}/health endpoint: Working${NC}"
else
    echo -e "${CROSS} ${RED}/health endpoint: Failed${NC}"
fi

# Test chat endpoint
CHAT_TEST=$(curl -s -X POST http://localhost:3001/api/chat \
    -H "Content-Type: application/json" \
    -d '{"userMessage": "test", "conversationHistory": [], "systemPrompt": "Reply with OK"}' \
    | grep -o '"success":true' || echo "failed")

if [ "$CHAT_TEST" != "failed" ]; then
    echo -e "${CHECK} ${GREEN}/api/chat endpoint: Working${NC}"
else
    echo -e "${CROSS} ${RED}/api/chat endpoint: Failed${NC}"
fi

echo ""

# =============================================================================
# STEP 10: Start Frontend Server
# =============================================================================
echo -e "${ROCKET} ${YELLOW}Starting frontend server...${NC}"

# Start frontend in background
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${INFO} Frontend starting (PID: $FRONTEND_PID)..."
echo -e "${INFO} Waiting for frontend to be ready..."

# Wait for frontend to start (max 15 seconds)
for i in {1..30}; do
    sleep 0.5
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${CHECK} ${GREEN}Frontend is running!${NC}"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${CROSS} ${RED}Frontend failed to start within 15 seconds${NC}"
        echo -e "${INFO} Check frontend.log for details"
        tail -20 frontend.log
        exit 1
    fi
done

echo ""

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${CHECK} Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${INFO} ${BLUE}Access your app:${NC}"
echo -e "   ${GREEN}Desktop:${NC}  http://localhost:5173"
echo -e "   ${GREEN}Mobile:${NC}   http://${COMPUTER_IP}:5173"
echo ""
echo -e "${INFO} ${BLUE}Backend API:${NC}"
echo -e "   ${GREEN}Local:${NC}    http://localhost:3001"
echo -e "   ${GREEN}Network:${NC}  http://${COMPUTER_IP}:3001"
echo ""
echo -e "${INFO} ${BLUE}Process IDs:${NC}"
echo -e "   Backend:  $BACKEND_PID"
echo -e "   Frontend: $FRONTEND_PID"
echo ""
echo -e "${INFO} ${BLUE}Logs:${NC}"
echo -e "   Backend:  tail -f backend.log"
echo -e "   Frontend: tail -f frontend.log"
echo ""
echo -e "${INFO} ${BLUE}To stop servers:${NC}"
echo -e "   kill $BACKEND_PID $FRONTEND_PID"
echo -e "   ${YELLOW}or${NC}"
echo -e "   lsof -ti:3001,5173 | xargs kill -9"
echo ""
echo -e "${ROCKET} ${GREEN}Happy coding!${NC}"
echo ""








