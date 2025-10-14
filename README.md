# Ihsan — Muslim Productivity & Worship Tracker

Ihsan is a MERN-stack web application to help Muslims track dhikr, analyze worship habits, and grow spiritually with a gentle, playful UI. This MVP (Phase 1) ships with Firebase Authentication, interactive Zikr counter, analytics dashboard, and an optional AI suggestion endpoint.

Tech stack

- Frontend: React + Vite + Tailwind CSS + DaisyUI + React Router + Recharts + Firebase Auth SDK
- Backend: Node.js + Express + MongoDB (Mongoose) + Firebase Admin + OpenAI (optional)
- Deployment: Vercel (frontend), Render (backend), MongoDB Atlas (M0)

Monorepo structure

- frontend/ — Vite React app
- backend/ — Express API

Quick start

1. Prerequisites

- Node.js 18+
- MongoDB Atlas M0 cluster
- Firebase project (Authentication enabled: Email/Password and Google)
- Optional: OpenAI API key for AI suggestions

2. Environment variables

- Copy the example env files and fill in values

Backend
cp backend/.env.example backend/.env

Frontend
cp frontend/.env.example frontend/.env

3. Install dependencies

# From repo root

cd backend && npm install
cd ../frontend && npm install

4. Run locally (two terminals)

# Terminal 1 — backend

cd backend
npm run dev

# Terminal 2 — frontend

cd frontend
npm run dev

- Backend: http://localhost:5000 (update PORT in .env if needed)
- Frontend: http://localhost:5173 (Vite may switch to 5174+ if busy)

CORS note
- If Vite chooses a different port (e.g., 5174), add it to FRONTEND_ORIGIN in backend .env: FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174

5. First login flow

- Create an account using Email/Password or Google Sign-In
- The frontend will obtain a Firebase ID token and verify with the backend via /api/auth/verify

6. Zikr & Analytics

- Choose or create a Zikr type
- Increment counter, Reset if needed
- Data auto-saves when idle or when you press Save
- View analytics for daily/weekly/monthly trends

Deployment
Frontend (Vercel)

- Import the frontend/ directory as a project
- Set Environment Variables (Vercel Project Settings → Environment Variables):
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_APP_ID
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_BACKEND_URL (your Render backend URL)
- Build Command: npm run build
- Output Directory: dist

Backend (Render)

- Create a new Web Service from the backend/ folder repo
- Environment:
  - Node 18+
  - Build Command: npm install
  - Start Command: npm start
- Environment Variables:
  - PORT: 5000
  - MONGODB_URI
  - FIREBASE_PROJECT_ID
  - FIREBASE_CLIENT_EMAIL
  - FIREBASE_PRIVATE_KEY (escape newlines as \n)
  - FRONTEND_ORIGIN (Vercel URL, e.g., https://your-app.vercel.app)
  - OPENAI_API_KEY (optional)

MongoDB Atlas

- Create an M0 cluster
- Whitelist IPs or set 0.0.0.0/0 (dev only)
- Create a database user
- Get connection string and put in backend .env

Firebase Auth

- Enable Email/Password and Google providers
- Get project config and fill frontend .env
- Create a service account (for Admin SDK) and copy credentials into backend .env

Notes

- AI suggestions are opt-in and only work if OPENAI_API_KEY is configured on the backend. Without it, the endpoint will return static suggestions.
- Theming and AI settings persist in localStorage.
- This is a non-commercial, privacy-first app. No analytics trackers.

Scripts
Backend

- npm run dev — nodemon dev server
- npm start — production server

Frontend

- npm run dev — Vite dev server
- npm run build — production build
- npm run preview — preview production build locally

Root

- npm run dev — runs backend and frontend together
- npm run install:all — installs backend and frontend

GitHub

- Ensure no secrets are committed (.env files are ignored). Commit .env.example files only.
- Initialize and push:

  git init
  git add .
  git commit -m "feat: Ihsan MVP scaffold (Phase 1)"
  git branch -M main
  git remote add origin <your_repo_url>
  git push -u origin main

License

- MIT — free for all.
