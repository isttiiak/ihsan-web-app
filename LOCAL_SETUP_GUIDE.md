# 🚀 Running Analytics Locally - Quick Guide

## ✅ **Problem Solved!**

Port 5000 is used by macOS Control Center, so we're using **port 5001** instead.

---

## 📝 **Current Configuration:**

### Backend (.env):

```env
PORT=5001  # Using 5001 to avoid macOS Control Center conflict
MONGODB_URI=mongodb+srv://...  # Your deployed MongoDB
```

### Frontend (.env):

```env
VITE_BACKEND_URL=http://localhost:5001  # Local backend
# VITE_BACKEND_URL=https://ihsan-web-app.onrender.com  # Deployed (commented out)
```

---

## 🚀 **To Run Locally:**

### 1. Start Backend (Terminal 1):

```bash
cd /Users/istiakislam/projects/ihsan/backend
npm run dev
```

✅ Backend runs on: **http://localhost:5001**

### 2. Start Frontend (Terminal 2):

```bash
cd /Users/istiakislam/projects/ihsan/frontend
npm run dev
```

✅ Frontend runs on: **http://localhost:5173**

### 3. Test Analytics:

1. Open: http://localhost:5173
2. Navigate to `/zikr`
3. Count some zikr (at least 100)
4. Click "📊 View Analytics & Progress"
5. See your analytics dashboard!

---

## 🔄 **Switching Between Local and Deployed Backend:**

### Use Local Backend (Development):

```env
# frontend/.env
VITE_BACKEND_URL=http://localhost:5001
```

### Use Deployed Backend (Production):

```env
# frontend/.env
VITE_BACKEND_URL=https://ihsan-web-app.onrender.com
```

**Note:** After changing `.env`, restart the frontend:

```bash
# Press Ctrl+C in frontend terminal
npm run dev
```

---

## ✅ **Benefits of Running Local Backend:**

1. ✅ **Faster Development** - No deployment wait time
2. ✅ **Immediate Testing** - See changes instantly
3. ✅ **Easy Debugging** - Console logs visible
4. ✅ **Real Data** - Connects to same MongoDB as production
5. ✅ **No Push Required** - Test before committing

---

## 📊 **What You Get:**

### Local Backend Running:

- ✅ All existing API routes work
- ✅ New analytics routes available:
  - `/api/analytics/goal`
  - `/api/analytics/streak`
  - `/api/analytics/analytics?days=N`
  - `/api/analytics/compare?days=N`
- ✅ Automatic streak checking
- ✅ Connects to deployed MongoDB

### Frontend Running:

- ✅ All pages work
- ✅ Can access `/zikr/analytics`
- ✅ Real-time updates
- ✅ Full analytics features

---

## 🐛 **Troubleshooting:**

### Backend won't start:

```bash
# Check what's on port 5001
lsof -i:5001

# Kill process if needed
lsof -ti:5001 | xargs kill -9
```

### Frontend shows 404 errors:

```bash
# Make sure backend is running
curl http://localhost:5001/api/health

# Should return: {"ok":true,"message":"Ihsan API is healthy"}
```

### Analytics page shows "Not Found" errors:

1. Verify backend is running: `curl http://localhost:5001/api/health`
2. Check frontend .env has: `VITE_BACKEND_URL=http://localhost:5001`
3. Restart frontend after changing .env
4. Clear browser cache (Cmd+Shift+R)

---

## 🎯 **When to Deploy to Render:**

Deploy when:

1. ✅ All features tested locally
2. ✅ No errors in console
3. ✅ Analytics working perfectly
4. ✅ Ready for production users

---

## 📦 **To Deploy Backend (When Ready):**

```bash
# 1. Commit all changes
git add .
git commit -m "Add zikr analytics v1.2"

# 2. Push to GitHub
git push origin main

# 3. Render will auto-deploy
# Wait 2-3 minutes for deployment

# 4. Test deployed API
curl https://ihsan-web-app.onrender.com/api/health

# 5. Update frontend .env to use deployed backend
VITE_BACKEND_URL=https://ihsan-web-app.onrender.com

# 6. Deploy frontend to Vercel
git push origin main
```

---

## 💡 **Pro Tips:**

1. **Keep Two Terminals Open:**

   - Terminal 1: Backend (`npm run dev`)
   - Terminal 2: Frontend (`npm run dev`)

2. **Use Local for Development:**

   - Faster iteration
   - Easier debugging
   - No need to deploy every change

3. **Use Deployed for Testing:**

   - Final testing before release
   - Share with others
   - Mobile device testing

4. **MongoDB Connection:**
   - Both local and deployed backend connect to the same MongoDB
   - Data is shared between local and deployed
   - Be careful with test data!

---

## ✅ **Current Status:**

- ✅ Backend running on port 5001 locally
- ✅ Frontend configured to use local backend
- ✅ MongoDB connected (deployed database)
- ✅ All analytics routes available
- ✅ Ready for testing!

---

## 🎉 **You're All Set!**

Now you can:

1. Develop and test analytics locally
2. See changes immediately
3. Deploy when ready

**Backend**: http://localhost:5001  
**Frontend**: http://localhost:5173  
**Analytics**: http://localhost:5173/zikr/analytics

---

**Happy Coding!** 🚀

**Last Updated**: October 15, 2025
