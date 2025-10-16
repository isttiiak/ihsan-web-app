# 🕌 Ihsan - Islamic Productivity App

**Live Demo:** [https://ihsan-web-app-main.vercel.app/](https://ihsan-web-app-main.vercel.app/)

A modern Islamic productivity application to help Muslims track their daily Zikr (remembrance of Allah), maintain streaks, set goals, and monitor their spiritual progress.

---

## ✨ Features

### 🔢 Zikr Counter

- Beautiful, intuitive counter interface
- Multiple Zikr types (SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah)
- Custom Zikr types support
- Real-time count tracking
- Smooth animations and haptic feedback

### 📊 Analytics Dashboard

- Daily, weekly, and custom period analytics
- Beautiful charts and visualizations
- Per-Zikr type breakdown
- Today vs All-time statistics
- Progress tracking

### 🎯 Goals & Streaks

- Set daily Zikr goals
- Track current and longest streaks
- Visual progress indicators
- Goal achievement celebrations
- Streak pause/resume feature

### 🌍 Worldwide Timezone Support

- **Automatic timezone detection** - Works for users anywhere in the world
- **Local midnight reset** - Daily reset occurs at user's local midnight
- **Accurate analytics** - All data reflects user's local timezone
- **Zero configuration** - Works automatically out of the box

### 🎨 Modern UI/UX

- Dark glassmorphism design
- Vivid gradients and spiritual aesthetics
- Smooth animations with Framer Motion
- Responsive design (mobile, tablet, desktop)
- Islamic-inspired color palette

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

### Zikr

- `POST /api/zikr/increment` - Increment Zikr count
- `POST /api/zikr/increment/batch` - Batch increment
- `GET /api/zikr/summary` - Get user summary
- `GET /api/zikr/types` - Get Zikr types
- `POST /api/zikr/type` - Add custom Zikr type

### Analytics

- `GET /api/analytics/analytics` - Get analytics data
- `GET /api/analytics/goal` - Get user goal
- `POST /api/analytics/goal` - Set/update goal
- `GET /api/analytics/streak` - Get streak info
- `POST /api/analytics/streak/pause` - Pause streak
- `POST /api/analytics/streak/resume` - Resume streak

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
