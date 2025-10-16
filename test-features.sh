#!/bin/bash

# 🧪 Feature Testing Script for Ihsan Zikr App
# This script helps verify all features are working correctly

echo "🔍 Ihsan Zikr App - Feature Verification"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking Backend Server..."
BACKEND_PID=$(ps aux | grep -i "node.*backend" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$BACKEND_PID" ]; then
    echo -e "${GREEN}✅ Backend is running (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start with: cd backend && npm run dev"
fi
echo ""

# Check if frontend is running
echo "2️⃣  Checking Frontend Server..."
FRONTEND_PID=$(ps aux | grep -i "vite.*frontend" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✅ Frontend is running (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo "   Start with: cd frontend && npm run dev"
fi
echo ""

# Check MongoDB connection
echo "3️⃣  Checking MongoDB..."
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB process not found (might be running as service)${NC}"
fi
echo ""

# Check key files
echo "4️⃣  Checking Key Files..."

FILES=(
    "backend/src/routes/zikr.routes.js"
    "backend/src/routes/analytics.routes.js"
    "backend/src/models/ZikrStreak.js"
    "backend/src/models/ZikrDaily.js"
    "frontend/src/pages/ZikrAnalytics.jsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (missing)"
    fi
done
echo ""

# Check for recent changes
echo "5️⃣  Recent Code Changes..."
echo "Last modified analytics.routes.js:"
if [ -f "backend/src/routes/analytics.routes.js" ]; then
    ls -lh backend/src/routes/analytics.routes.js | awk '{print "   " $6, $7, $8}'
fi
echo ""

# Feature Checklist
echo "6️⃣  Feature Verification Checklist"
echo "=================================="
echo ""
echo "Database Upload:"
echo "  [ ] Add zikr count"
echo "  [ ] Refresh page"
echo "  [ ] Count persists"
echo "  [ ] Check Network tab (200 response)"
echo ""
echo "Streak Logic:"
echo "  [ ] Streak increments when goal met"
echo "  [ ] Pause button works"
echo "  [ ] Resume button works"
echo "  [ ] 1-day grace period applies"
echo "  [ ] Resets after 2+ days missed"
echo ""
echo "Daily Goal:"
echo "  [ ] Progress bar shows correctly"
echo "  [ ] Update goal in modal"
echo "  [ ] Progress updates immediately"
echo "  [ ] Affects streak status"
echo ""
echo "Stats:"
echo "  [ ] Today's Count = sum of breakdown"
echo "  [ ] All-Time Best shows > 0"
echo "  [ ] Types Done = unique types count"
echo "  [ ] All-Time Total matches header"
echo ""
echo "Chart:"
echo "  [ ] Switches between 7-180 days"
echo "  [ ] Stats stay constant when switching"
echo "  [ ] Dates on X-axis correct"
echo ""

# Instructions
echo "7️⃣  Next Steps"
echo "=============="
echo ""
echo "1. ${YELLOW}Hard refresh browser:${NC} Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)"
echo "2. ${YELLOW}Check All-Time Best:${NC} Should now show correct value"
echo "3. ${YELLOW}Test each feature${NC} using the checklist above"
echo "4. ${YELLOW}Monitor console${NC} for errors (F12 → Console)"
echo ""

# API endpoints
echo "8️⃣  API Endpoints to Test"
echo "========================"
echo ""
echo "Backend should be at: http://localhost:5000"
echo "Frontend should be at: http://localhost:5173"
echo ""
echo "Key endpoints:"
echo "  POST /api/zikr/increment"
echo "  GET  /api/analytics/analytics?days=7"
echo "  GET  /api/analytics/goal"
echo "  POST /api/analytics/goal"
echo "  POST /api/analytics/streak/pause"
echo "  POST /api/analytics/streak/resume"
echo ""

echo "✨ All checks complete!"
echo ""
echo "${YELLOW}📖 See FEATURE_VERIFICATION_REPORT.md for detailed documentation${NC}"
