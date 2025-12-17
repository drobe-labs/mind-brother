#!/bin/bash

# Verify Classification System Integration

echo "🔍 VERIFYING CLASSIFICATION SYSTEM INTEGRATION"
echo "========================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check 1: Core files exist
echo "📁 Checking core files..."
FILES=(
  "lib/messageClassifier.ts"
  "lib/claudeClassifier.ts"
  "lib/hybridClassifier.ts"
  "lib/intelligentChatbot.ts"
  "backend/server.js"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "   ${GREEN}✅${NC} $file"
  else
    echo -e "   ${RED}❌${NC} $file (MISSING)"
    ALL_FILES_EXIST=false
  fi
done

echo ""

# Check 2: Test files exist
echo "🧪 Checking test files..."
TEST_FILES=(
  "test-claude-classification.js"
  "test-ambiguous-phrases.js"
  "test-comprehensive-disambiguation.js"
  "test-hybrid-classifier.js"
  "run-all-tests.sh"
)

ALL_TESTS_EXIST=true
for file in "${TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "   ${GREEN}✅${NC} $file"
  else
    echo -e "   ${YELLOW}⚠️${NC}  $file (optional, not critical)"
  fi
done

echo ""

# Check 3: Documentation exists
echo "📚 Checking documentation..."
DOC_COUNT=$(ls -1 *CLASSIFICATION*.md *DISAMBIGUATION*.md *AMBIGUOUS*.md *HYBRID*.md *APPROACH*.md 2>/dev/null | wc -l)
echo -e "   ${GREEN}✅${NC} Found $DOC_COUNT documentation files"

echo ""

# Check 4: SimpleChatbot integration
echo "🔌 Checking SimpleChatbot.tsx integration..."
if grep -q "intelligentChatbot" "src/components/SimpleChatbot.tsx" 2>/dev/null; then
  echo -e "   ${GREEN}✅${NC} intelligentChatbot imported"
else
  echo -e "   ${RED}❌${NC} intelligentChatbot NOT imported"
fi

if grep -q "classification" "src/components/SimpleChatbot.tsx" 2>/dev/null; then
  echo -e "   ${GREEN}✅${NC} Classification metadata tracked"
else
  echo -e "   ${YELLOW}⚠️${NC}  Classification metadata not tracked (optional)"
fi

echo ""

# Check 5: Backend endpoint
echo "🖥️  Checking backend endpoint..."
if grep -q "/api/classify" "backend/server.js" 2>/dev/null; then
  echo -e "   ${GREEN}✅${NC} /api/classify endpoint exists"
else
  echo -e "   ${RED}❌${NC} /api/classify endpoint MISSING"
fi

echo ""

# Check 6: Backend running
echo "🚀 Checking backend status..."
if curl -s http://mind-brother-production.up.railway.app:3001/health > /dev/null 2>&1; then
  echo -e "   ${GREEN}✅${NC} Backend is running on port 3001"
  BACKEND_RUNNING=true
else
  echo -e "   ${YELLOW}⚠️${NC}  Backend is NOT running"
  echo "   To start: cd backend && node server.js"
  BACKEND_RUNNING=false
fi

echo ""
echo "========================================================================"
echo ""

# Summary
if [ "$ALL_FILES_EXIST" = true ] && [ "$BACKEND_RUNNING" = true ]; then
  echo -e "${GREEN}✅ INTEGRATION VERIFIED - SYSTEM READY!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Run tests: ./run-all-tests.sh"
  echo "  2. Start frontend: npm start"
  echo "  3. Test in browser: http://mind-brother-production.up.railway.app:5173"
  echo ""
  exit 0
elif [ "$ALL_FILES_EXIST" = true ]; then
  echo -e "${YELLOW}⚠️  INTEGRATION READY - START BACKEND${NC}"
  echo ""
  echo "Start backend:"
  echo "  cd backend && node server.js"
  echo ""
  echo "Then run tests:"
  echo "  ./run-all-tests.sh"
  echo ""
  exit 0
else
  echo -e "${RED}❌ INTEGRATION INCOMPLETE${NC}"
  echo ""
  echo "Missing core files. Please review implementation."
  echo ""
  exit 1
fi












