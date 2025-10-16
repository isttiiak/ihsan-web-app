# 📚 Ihsan App Documentation

Documentation for the Ihsan Islamic Productivity App.

---

## ✅ Latest Implementation: Worldwide Timezone Support

**Date:** October 17, 2025  
**Status:** Complete

### What Was Done
- ✅ Created flexible timezone utility (backend: `utils/timezone-flexible.js`)
- ✅ Created timezone detection utility (frontend: `utils/timezone.js`)
- ✅ Updated backend routes to accept `timezoneOffset` parameter
- ✅ Updated frontend to auto-detect and send user's timezone
- ✅ Daily reset now occurs at user's local midnight (not Dhaka midnight for everyone)
- ✅ Analytics reflect user's local timezone
- ✅ Fully tested and working with no errors

### Key Features
- 🌍 **Auto-detection** - Frontend automatically detects browser timezone
- ⏰ **Local midnight reset** - Each user experiences reset at their local midnight
- 📊 **Accurate analytics** - Data reflects user's timezone
- 🔒 **Backward compatible** - Defaults to Dhaka (UTC+6) if timezone not sent

### Files Modified
**Backend:**
- `backend/src/utils/timezone-flexible.js` (new)
- `backend/src/routes/zikr.routes.js` (updated)
- `backend/src/routes/analytics.routes.js` (updated)

**Frontend:**
- `frontend/src/utils/timezone.js` (new)
- `frontend/src/store/useZikrStore.js` (already had support)
- `frontend/src/pages/ZikrAnalytics.jsx` (updated)

### How It Works
```javascript
// Frontend: Auto-detect timezone
const offset = getUserTimezoneOffset(); // e.g., 360 for Dhaka, -300 for NY

// Frontend: Send with API calls
fetch('/api/zikr/increment', {
  body: JSON.stringify({ 
    increments: [...], 
    timezoneOffset: offset 
  })
});

// Backend: Use user's timezone
const userOffset = timezoneOffset || DEFAULT_TIMEZONE_OFFSET;
const today = truncateToTimezone(Date.now(), userOffset);
```

### No Environment Variable Needed
The `DEFAULT_TIMEZONE_OFFSET` is hardcoded to Dhaka (UTC+6) as a fallback. This is fine because:
- Frontend always sends the correct timezone
- Fallback is only for edge cases
- Less configuration = fewer errors

---

## 🎉 Result

Users worldwide now experience correct daily reset timing at their local midnight!

- **User in New York (UTC-5):** Reset at 12:00 AM NY time
- **User in Tokyo (UTC+9):** Reset at 12:00 AM Tokyo time  
- **User in Dhaka (UTC+6):** Reset at 12:00 AM Dhaka time

**Status:** ✅ Ready for deployment
