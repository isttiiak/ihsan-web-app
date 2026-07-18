# 🕌 Ihsan - Islamic Productivity App

**Live Demo:** [https://ihsan-web-app-main.vercel.app/](https://ihsan-web-app-main.vercel.app/)

A modern Islamic productivity application to help Muslims track their daily Zikr (remembrance of Allah), maintain streaks, set goals, and monitor their spiritual progress.

---

## ✨ Features

### 📿 Zikr Counter
- Local-first tap counter with haptics, focus mode, and custom dhikr (with verified hadith references)
- Daily goals and a fair streak system — miss one day and you get a grace chance 🧊; backfill up to 2 days to repair a streak
- Analytics: trends, per-type breakdown, weekly heatmap with met/grace/missed tags

### 🕌 Salat Tracker
- All five fard prayers with on-time / kaza / missed states, location (mosque/jamaah/home), post-salat sunnah toggles
- Nafl prayers (Tahajjud, Duha, Ishraq…) with authentic references
- Streaks, per-prayer analytics, and a 90-day calendar

### 🕐 Prayer Times
- Calculated fully on-device (adhan, Moonsighting Committee) — GPS or city search, no external API
- Live clock with current/next prayer, forbidden windows and nafl windows on an educational timeline

### 🌙 Fasting Tracker
- Fiqh-aware: qaḍā make-up counter, kaffārah (consecutive-day tracking), vowed fasts, and every sunnah day (Mon/Thu, White Days, ʿArafah, ʿĀshūrā…)
- Blocks ḥarām days (Eids, Tashrīq) and warns on disliked ones — each rule cites its exact hadith
- Intention auto-completes after iftar; month calendar; full analytics with editable history

### 📖 Quran Habit
- One-tap page logging with a daily-minimum goal, reading streaks, and a khatm bookmark across the 604-page mushaf
- Pace estimate for finishing your khatm, verified virtues of recitation

### 🤝 Friends — “So compete with one another in doing good” (Quran 2:148)
- Connect via a single invite link; see each other's streaks and today's worship
- A calm daily measure called **Noor** (max 100: prayers 50 · zikr streak 20 · Quran goal 20 · fasting 10) — today's Noor resets at midnight, all-time Noor only ever grows

### 🌸 Rayhanah Cycle — for our sisters
- The first Muslim productivity app with first-class menstrual & post-natal (nifās) support
- Salat & fasting pause automatically with zero guilt — dhikr, Quran listening & ṣalawāt take over your Noor, and nothing about it is ever visible to friends
- Ghusl guide, cycle predictions, madhab-aware istiḥāḍa guidance, and Ramadan days auto-added to your qaḍā counter
- Modern cycle facilities: private flow/symptom/mood notes, a cycle calendar with predicted windows, personal rhythm stats, and a pre-period heads-up

### 🌙 Ramadan Tracker
- A dedicated home for the blessed month: countdown & preparation before it, a 30-day grid during it
- Suhoor & iftar times on-device, tarawih nights, Laylat al-Qadr odd-night focus with the du'a of the night
- Rayhanah-aware: excused days show 🌸 and flow into the qaḍā counter automatically

### 🌍 Built right
- Hijri dates with a ±1-day moon-sighting adjustment; every quote linked to quran.com / sunnah.com with grading
- Fajr-to-Fajr worship day (the day flips at dawn, not midnight); celebration animations that respect reduced-motion
- Full data ownership: export and per-feature deletion from Settings

---

## 🚀 Tech Stack

### Frontend

- **React** - UI framework
- **Vite** - Build tool
- **Zustand** - State management
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **DaisyUI** - Component library

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Firebase Auth** - Authentication
- **Mongoose** - ODM

---

## 📁 Project Structure

```
ihsan/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand store
│   │   └── utils/        # Utility functions
│   └── package.json
│
├── backend/           # Express backend API
│   ├── src/
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   ├── utils/        # Utility functions
│   │   └── jobs/         # Cron jobs
│   └── package.json
│
└── docs/              # Documentation
    └── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Firebase project (for authentication)

### 1. Clone the repository

```bash
git clone https://github.com/isttiiak/ihsan.git
cd ihsan
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Add your environment variables:
# - MONGODB_URI
# - FIREBASE_PROJECT_ID
# - FIREBASE_PRIVATE_KEY
# - FIREBASE_CLIENT_EMAIL
# - PORT

# Start backend
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Add your environment variables:
# - VITE_BACKEND_URL
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_AUTH_DOMAIN
# - VITE_FIREBASE_PROJECT_ID
# - VITE_FIREBASE_STORAGE_BUCKET
# - VITE_FIREBASE_MESSAGING_SENDER_ID
# - VITE_FIREBASE_APP_ID
# - VITE_GA_MEASUREMENT_ID   (optional — Google Analytics 4, e.g. G-XXXXXXXXXX)

# Start frontend
npm run dev
```

### 4. Access the app

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 🌍 Worldwide Timezone Support

The app automatically detects the user's timezone and provides accurate daily reset timing:

- **User in New York (UTC-5):** Daily reset at 12:00 AM New York time
- **User in Tokyo (UTC+9):** Daily reset at 12:00 AM Tokyo time
- **User in Dhaka (UTC+6):** Daily reset at 12:00 AM Dhaka time

No configuration needed - it just works! ✨

---

## 🎯 Key Features Explained

### Daily Reset Logic

- Automatically resets daily counts at local midnight
- Preserves streak and lifetime totals
- Smart detection on page focus/visibility change
- No wasteful polling or intervals

### Analytics

- View data for 7, 15, 30, 60, 90, or 180 days
- See today's progress vs all-time statistics
- Beautiful charts with gradient fills
- Per-Zikr type breakdown

### Authentication

- Secure Firebase authentication
- Email/password login
- Protected routes
- Persistent sessions

---

## 📝 API Endpoints

All routes are Bearer-token authenticated (Firebase) and zod-validated.

| Area | Base | Highlights |
|---|---|---|
| Zikr | `/api/zikr` | `POST /increment/batch`, `GET /summary`, `GET\|POST /types`, `DELETE /all` |
| Analytics | `/api/analytics` | `GET /` (charts + derived streak), `GET\|POST /goal`, `POST /streak/pause\|resume` |
| Salat | `/api/salat` | `GET /?date=`, `PATCH /prayer`, `PATCH /nafl`, `GET /analytics?today=`, `DELETE /all` |
| Fasting | `/api/fasting` | `PUT /log`, `GET /summary?today=`, `GET /history`, `PATCH /profile`, vows CRUD, `DELETE /all` |
| Quran | `/api/quran` | `POST /read`, `GET /summary?today=`, `PATCH /profile`, `DELETE /all` |
| Cycle | `/api/cycle` | `GET /summary`, `POST /start`, `POST /end`, `PUT /day`, `PATCH /profile`, `DELETE /all` |
| Social | `/api/social` | `GET /summary` (leaderboard), `GET /noor`, `GET /friends` (list + join date), `POST /connect`, `DELETE /friends/:uid` |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 🚀 Deployment

### Backend (e.g., Render, Railway)

1. Push code to GitHub
2. Connect repository to hosting service
3. Set environment variables
4. Deploy!

### Frontend (e.g., Vercel, Netlify)

1. Push code to GitHub
2. Connect repository to hosting service
3. Set environment variables
4. Deploy!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Islamic design inspiration
- Open source community
- Allah SWT for guidance

---

## 📧 Contact

**Istiak Islam**

- GitHub: [@isttiiak](https://github.com/isttiiak)
- Email: isttiiak@gmail.com

---

## 🌟 Show your support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ for the Muslim community**
