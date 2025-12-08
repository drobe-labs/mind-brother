#!/bin/bash

# Mind Brother Project Cleanup Script
# This script safely removes duplicate and unused files
# Author: Claude
# Date: 2025-11-09

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root (run this from your project root directory)
PROJECT_ROOT=$(pwd)
SRC_DIR="$PROJECT_ROOT/src"
BACKUP_DIR="$PROJECT_ROOT/backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Mind Brother Project Cleanup Script         ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "$SRC_DIR" ]; then
    echo -e "${RED}❌ Error: src/ directory not found!${NC}"
    echo -e "${RED}Please run this script from your project root directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found project directory: $PROJECT_ROOT${NC}"
echo ""

# Create backup directory
echo -e "${YELLOW}📦 Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup directory created: $BACKUP_DIR${NC}"
echo ""

# Function to safely move file
move_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${YELLOW}  Moving: $(basename $file)${NC}"
        mv "$file" "$BACKUP_DIR/"
        return 0
    else
        echo -e "${RED}  Not found: $(basename $file) (skipping)${NC}"
        return 1
    fi
}

# Counter for moved files
moved_count=0

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 1: Removing Old Auth Components${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"

files_to_move=(
    "$SRC_DIR/components/Login.tsx"
    "$SRC_DIR/components/SignIn.tsx"
    "$SRC_DIR/components/EnhancedLogin.tsx"
    "$SRC_DIR/components/IndividualSignup.tsx"
    "$SRC_DIR/components/ProfessionalSignup.tsx"
)

for file in "${files_to_move[@]}"; do
    if move_file "$file"; then
        ((moved_count++))
    fi
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 2: Removing Test/Demo Files${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"

demo_files=(
    "$SRC_DIR/components/SimpleChatbot.tsx"
    "$SRC_DIR/components/SimpleChatbotOnly.tsx"
    "$SRC_DIR/components/SimpleTest.tsx"
)

for file in "${demo_files[@]}"; do
    if move_file "$file"; then
        ((moved_count++))
    fi
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 3: Removing Duplicate Files${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"

duplicate_files=(
    "$SRC_DIR/components/AuthFlow.tsx"
    "$SRC_DIR/components/AuthTypeSelector.tsx"
)

for file in "${duplicate_files[@]}"; do
    if move_file "$file"; then
        ((moved_count++))
    fi
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 4: Check Optional Files (Manual Review)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}The following files may or may not be needed.${NC}"
echo -e "${YELLOW}Please review manually:${NC}"
echo ""

optional_files=(
    "$SRC_DIR/components/LandingPage.tsx"
    "$SRC_DIR/components/ContactUs.tsx"
    "$SRC_DIR/components/PrivacyNotice.tsx"
    "$SRC_DIR/components/AmaniMemoji.tsx"
    "$SRC_DIR/components/Analytics Dashboard.tsx"
    "$SRC_DIR/components/EvaluationDashboard.tsx"
)

for file in "${optional_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${BLUE}  📄 $(basename "$file")${NC}"
    fi
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Cleanup Summary${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Files moved to backup: $moved_count${NC}"
echo -e "${GREEN}Backup location: $BACKUP_DIR${NC}"
echo ""

# Test build
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 5: Testing Build${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Running npm run build to verify nothing broke...${NC}"
echo ""

if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful! Your app still works!${NC}"
    echo ""
    
    # Offer to delete backup
    echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Your backup files are in: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo -e "${BLUE}1)${NC} Keep backup (safe, you can delete later)"
    echo -e "${BLUE}2)${NC} Delete backup permanently"
    echo -e "${BLUE}3)${NC} Restore files from backup"
    echo ""
    read -p "Enter choice (1/2/3): " choice
    
    case $choice in
        2)
            echo -e "${RED}Permanently deleting backup...${NC}"
            rm -rf "$BACKUP_DIR"
            echo -e "${GREEN}✅ Backup deleted!${NC}"
            ;;
        3)
            echo -e "${YELLOW}Restoring files...${NC}"
            cp -r "$BACKUP_DIR"/* "$SRC_DIR/components/"
            echo -e "${GREEN}✅ Files restored!${NC}"
            ;;
        *)
            echo -e "${GREEN}✅ Backup kept at: $BACKUP_DIR${NC}"
            echo -e "${YELLOW}You can delete it manually when you're confident everything works.${NC}"
            ;;
    esac
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${YELLOW}Restoring files from backup...${NC}"
    cp -r "$BACKUP_DIR"/* "$SRC_DIR/components/"
    echo -e "${GREEN}✅ Files restored!${NC}"
    echo -e "${RED}Please check the errors above and fix them before running cleanup again.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Cleanup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Test your app: ${YELLOW}npm run dev${NC}"
echo -e "  2. Check all features work"
echo -e "  3. Commit changes: ${YELLOW}git add . && git commit -m 'Clean up unused files'${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
