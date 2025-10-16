# Quick Testing Guide

## ✅ What's Been Fixed

1. **180 Days View Added** - You can now view trends over 180 days
2. **Daily Reset Fixed** - Counts now reset at midnight automatically
3. **All Time Breakdown Fixed** - "All Time" tab now shows historical data

## 🧪 How to Test Right Now

### 1. Test 180 Days View

1. Go to: http://localhost:5174/zikr-analytics
2. Scroll to "Trends & Insights" section
3. Look for the period buttons - you should see:
   - 7 Days ✓
   - 15 Days ✓
   - 30 Days ✓
   - 60 Days ✓
   - 90 Days ✓
   - **180 Days ✓** (NEW!)
4. Click "180 Days" - chart should update

### 2. Test Daily Reset (Quick Method)

**Open Browser DevTools Console and run:**

```javascript
// Step 1: Check current state
const store = JSON.parse(localStorage.getItem("ihsan_zikr_store"));
console.log("📊 Current State:");
console.log("  Last Reset:", store.state.lastResetDate);
console.log("  Today Counts:", store.state.counts);
console.log("  Today is:", new Date().toDateString());

// Step 2: Simulate yesterday (force reset trigger)
store.state.lastResetDate = new Date(Date.now() - 86400000).toDateString();
localStorage.setItem("ihsan_zikr_store", JSON.stringify(store));
console.log("⚙️  Set lastResetDate to yesterday");

// Step 3: Reload to trigger reset
console.log("🔄 Refreshing page...");
setTimeout(() => location.reload(), 1000);
```

**After page reloads:**

- Check console for: `✨ Daily counts reset for new day: [today's date]`
- All counters should show 0
- Try incrementing - should work normally

### 3. Test "All Time" Breakdown

1. Go to: http://localhost:5174/zikr-analytics
2. Scroll to "Breakdown by Type" section
3. Click "🕊️ All Time" tab
4. You should see all zikr types with their historical totals
5. Compare with "📅 Today" tab to verify difference

### 4. Test Today's Count After Midnight

**Automated Test (Change System Time):**

1. Add some counts (e.g., 50 SubhanAllah)
2. Change your Mac system time to tomorrow:
   ```bash
   # Note: You might need sudo
   sudo date -u 1016120025  # Oct 16, 12:00 AM, 2025
   ```
3. Refresh the app
4. Counts should be 0
5. **Important:** Reset time back to current:
   ```bash
   sudo sntp -sS time.apple.com
   ```

**Manual Test (Wait for Midnight):**

- Just use the app normally
- After midnight (12 AM), any action (refresh or increment) will reset counts
- Check console for reset message

## 🐛 Known Issues & Warnings

1. **MongoDB Duplicate Index Warnings**

   - Shows in backend console
   - Doesn't affect functionality
   - Can be ignored for now

2. **404 on /api/analytics/compare**
   - This endpoint is not implemented yet
   - App still works fine without it
   - Can be ignored

## 📊 What to Verify

- [ ] 180 days button exists and works
- [ ] Today's count resets at midnight
- [ ] All Time tab shows historical data
- [ ] Streak calculation is accurate
- [ ] Goal progress updates correctly
- [ ] No errors in browser console (except expected ones)

## 🔍 Console Messages to Look For

**Good Messages:**

```
✨ Daily counts reset for new day: Wed Oct 16 2025
```

**Bad Messages (report if you see these):**

```
Error: ...
Failed to ...
Cannot read ...
```

## 📱 Test Scenarios

### Scenario 1: New Day

- Before midnight: Add 50 zikr
- After midnight: Check counts (should be 0)
- Result: ✅ Reset worked

### Scenario 2: Goal Progress

- Set goal to 100
- Add 50 zikr → Progress: 50%
- Add 50 more → Progress: 100% ✅ Goal Met!
- Wait for next day → Progress: 0% (fresh start)

### Scenario 3: Streak

- Day 1: Meet goal (100+) → Streak: 1
- Day 2: Meet goal → Streak: 2
- Day 3: Miss goal → Streak: 2 (grace)
- Day 4: Miss again → Streak: 0 (reset)

## 🆘 If Something Breaks

**Reset Everything:**

```javascript
// In browser console
localStorage.clear();
location.reload();
```

**Then log in again and start fresh.**

## ✨ Success Criteria

- ✅ App loads without errors
- ✅ Can add zikr counts
- ✅ Counts persist until midnight
- ✅ Counts reset at midnight
- ✅ 180-day view works
- ✅ All time data shows correctly
- ✅ Streak calculates properly

## 📞 Need Help?

Check these logs:

1. Browser Console (F12)
2. Backend Terminal
3. Network tab (for API calls)
