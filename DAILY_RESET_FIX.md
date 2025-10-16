# Daily Reset Fix & 180 Days View

## Changes Made

### 1. Added 180 Days View to Trends & Insights

**File:** `frontend/src/pages/ZikrAnalytics.jsx`

- Added `{ label: "180 Days", value: 180 }` to the periods array
- Users can now view trends over 7, 15, 30, 60, 90, and 180 days

### 2. Fixed Daily Count Reset Issue

**Problem:** Daily counts were never resetting at midnight (12 AM). The Zustand store was persisting counts indefinitely.

**Solution:** Implemented a date-based reset mechanism

#### Changes in `frontend/src/store/useZikrStore.js`:

1. **Added `lastResetDate` field** to track the last reset date
2. **Added `checkAndResetIfNewDay()` method** that:

   - Compares current date with last reset date
   - Resets `counts` and `pending` if it's a new day
   - Updates `lastResetDate` to today
   - Logs reset action to console

3. **Integrated reset checks**:

   - Called in `hydrate()` - when user logs in or refreshes
   - Called in `increment()` - before every count increment
   - This ensures counts reset at the right time

4. **Persisted `lastResetDate`** in localStorage for consistency across sessions

#### Changes in `frontend/src/App.jsx`:

1. **Added periodic check** - every 60 seconds (1 minute)
   - Ensures reset happens even if user keeps app open past midnight
   - Uses `setInterval` with cleanup

## How It Works

### Daily Reset Flow:

```
User Opens App / Increments Count
         ↓
checkAndResetIfNewDay() called
         ↓
Compare: lastResetDate vs today's date
         ↓
If Different Date → Reset counts, pending, update lastResetDate
If Same Date → No action needed
         ↓
Continue normal operation
```

### Important Notes:

1. **Counts Reset at Midnight**

   - Uses JavaScript's `toDateString()` which is based on user's local timezone
   - Reset happens automatically when date changes

2. **Backend Still Tracks Everything**

   - Backend stores all zikr in `ZikrDaily` collection with dates
   - Frontend `counts` is just for TODAY's display
   - `lifetimeTotals` persists and shows all-time data

3. **Streak Calculation**
   - Backend calculates streak based on `ZikrDaily` records
   - Checks if daily goal was met each day
   - Provides 1-day grace period (can miss 1 day)

## Testing Instructions

### Test 1: Verify 180 Days View

1. Navigate to Analytics page
2. Click on "Trends & Insights" section
3. Verify you see 6 period buttons: 7, 15, 30, 60, 90, **180 Days**
4. Click "180 Days" and verify chart updates

### Test 2: Daily Reset Logic

**Option A: Manual Date Change (Testing)**

```javascript
// Open browser console
// Get current store state
const store = JSON.parse(localStorage.getItem("ihsan_zikr_store"));
console.log("Current lastResetDate:", store.state.lastResetDate);
console.log("Current counts:", store.state.counts);

// Change the lastResetDate to yesterday
store.state.lastResetDate = new Date(Date.now() - 86400000).toDateString();
localStorage.setItem("ihsan_zikr_store", JSON.stringify(store));

// Refresh page - counts should reset
location.reload();
```

**Option B: Wait for Midnight**

1. Add some zikr counts before midnight
2. Note the counts for each type
3. Keep browser open or close it
4. After midnight (12:00 AM):
   - Refresh the page OR increment any count
   - Verify counts show 0 for all types
   - Check console for: "✨ Daily counts reset for new day: [date]"

**Option C: Change System Time (Advanced)**

1. Count some zikr
2. Change your computer's system time to tomorrow
3. Refresh the app
4. Counts should reset to 0

### Test 3: Streak Calculation

1. **Day 1**: Count enough zikr to meet daily goal (default 100)
   - Streak should show: 1 day
2. **Day 2**: Count enough to meet goal again
   - Streak should show: 2 days
3. **Day 3**: Miss the goal (count less than target)
   - Streak should remain: 2 days (grace period)
4. **Day 4**: Miss again
   - Streak should reset: 0 days

### Test 4: Today's Count Accuracy

1. Open app and verify today's count starts at 0
2. Add 10 SubhanAllah
3. Verify:
   - Counter shows 10
   - Today's total in analytics shows 10
   - Goal progress updates
4. Add 5 Alhamdulillah
5. Verify:
   - Counter shows 5 for Alhamdulillah
   - Today's total shows 15 (10 + 5)
   - Breakdown by Type (Today tab) shows both

## Backend Verification

The backend streak calculation is in `backend/src/routes/zikr.routes.js`:

```javascript
async function checkAndUpdateStreak(userId)
```

This function:

1. Gets today's total from `ZikrDaily` collection
2. Compares with daily goal
3. Updates streak in `ZikrStreak` collection
4. Called after every batch increment

## Console Logs to Watch

When testing, check browser console for:

- `✨ Daily counts reset for new day: [date]` - confirms reset happened
- Any errors related to zustand or localStorage

## Rollback (If Needed)

If issues occur, you can manually reset the store:

```javascript
// In browser console
localStorage.removeItem("ihsan_zikr_store");
location.reload();
```

## Files Modified

1. ✅ `frontend/src/pages/ZikrAnalytics.jsx` - Added 180 days period
2. ✅ `frontend/src/store/useZikrStore.js` - Daily reset logic
3. ✅ `frontend/src/App.jsx` - Periodic reset check
4. ✅ `backend/src/routes/analytics.routes.js` - Added perType to response (previous fix)
5. ✅ `backend/src/routes/zikr.routes.js` - Verified streak logic (no changes needed)

## Expected Behavior After Fix

- ✅ Daily counts reset at midnight
- ✅ Streak calculates correctly based on goal completion
- ✅ Today's count shows current day only
- ✅ All-time totals persist correctly
- ✅ 180-day view available in analytics
- ✅ No need for manual reset or page refresh after midnight
