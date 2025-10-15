# 🎨 Visual Guide - What You'll See

This guide shows you exactly what each page looks like and what to expect.

---

## 🏠 Home Page (`/`)

```
┌─────────────────────────────────────────────┐
│         [Navbar with logo]                  │
├─────────────────────────────────────────────┤
│                                             │
│   Assalamu alaykum, [Name]!                │
│   Good [morning/afternoon/evening]          │
│   What would you like to focus on today?   │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │  📿 Zikr     │  │  🕌 Salat    │       │
│  │  Counter     │  │  Tracker     │       │
│  │              │  │              │       │
│  │  Today: 150  │  │  Today: 0/5  │       │
│  │  [Start]     │  │  [Track]     │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │  🌙 Fasting  │  │  ⏰ Prayer   │       │
│  │  Tracker     │  │  Times       │       │
│  │              │  │              │       │
│  │  Streak: 0   │  │  Next: Fajr  │       │
│  │  [Log Fast]  │  │  [View]      │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**

- 4 beautiful cards with gradients
- Click any card to enter focus mode
- Real-time stats on each card
- Fully responsive grid layout

---

## 📿 Zikr Counter (`/dashboard`)

```
┌─────────────────────────────────────────────┐
│  [Back] 🕌 Ihsan                           │
├─────────────────────────────────────────────┤
│                                             │
│              📿 Tasbeeh                     │
│                                             │
│         ┌──────────────┐                   │
│         │              │                   │
│         │     150      │                   │
│         │              │                   │
│         └──────────────┘                   │
│                                             │
│         Goal: 100/200                       │
│         [Progress Bar]                      │
│                                             │
│    [ - ]  [ + ]  [ Reset ]  [ + 10 ]      │
│                                             │
│  SubhanAllah       33                      │
│  Alhamdulillah     33                      │
│  Allahu Akbar      33                      │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**

- Large counter display
- Increment/decrement buttons
- Multiple zikr types
- Goal tracking with progress bar

---

## 🕌 Salat Tracker (`/salat`)

```
┌─────────────────────────────────────────────┐
│  [Back] 🕌 Ihsan                           │
├─────────────────────────────────────────────┤
│                                             │
│              🕌 Salat Tracker              │
│       Track your five daily prayers         │
│                                             │
│         ┌──────────────┐                   │
│         │   O O O O O  │  Progress Ring    │
│         │    2 / 5     │                   │
│         └──────────────┘                   │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  🌅 Fajr      ✓      Dawn       05:30│  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  ☀️ Dhuhr     ○      Noon       12:30│  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  🌤️ Asr       ✓      Afternoon  15:45│  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  🌆 Maghrib   ○      Sunset     18:15│  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  🌙 Isha      ○      Night      19:30│  │
│  └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**

- Circular progress indicator
- Tap to mark prayers complete
- Auto-resets at midnight
- Visual checkmarks for completed prayers

---

## 🌙 Fasting Tracker (`/fasting`)

```
┌─────────────────────────────────────────────┐
│  [Back] 🕌 Ihsan                           │
├─────────────────────────────────────────────┤
│                                             │
│           🌙 Fasting Tracker               │
│        Monitor your fasting journey         │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  Current Streak:        5 days      │  │
│  │  🔥 🔥 🔥 🔥 🔥                     │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  📊 Stats                           │  │
│  │  Total Days: 47                     │  │
│  │  This Month: 12                     │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  Monthly Goal: 12/30 days           │  │
│  │  [████████░░░░░░░░░░░░] 40%        │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  [ Fasting Today: ON ]                     │
│                                             │
│  [Set Goal]  [View History]  [Reset]      │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**

- Streak counter with fire emojis
- Total days fasted
- Monthly goal progress bar
- Quick toggle for today

---

## ⏰ Prayer Times (`/prayer-times`)

```
┌─────────────────────────────────────────────┐
│  [Back] 🕌 Ihsan                           │
├─────────────────────────────────────────────┤
│                                             │
│            ⏰ Prayer Times                  │
│          Never miss a prayer                │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │         02:35:47 PM                 │  │
│  │    Friday, December 20, 2024        │  │
│  │                                     │  │
│  │       Next Prayer                   │  │
│  │    🌆 Maghrib at 18:15             │  │
│  │       in 5h 39m                     │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  🌅 Fajr         05:30              │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  🌄 Sunrise      06:45              │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  ☀️ Dhuhr        12:30              │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  🌤️ Asr          15:45              │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  🌆 Maghrib      18:15  ← Next      │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  🌙 Isha         19:30              │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  📍 Location: Not set [Enable]             │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**

- Live updating clock
- Next prayer highlighted
- Countdown to next prayer
- Geolocation support
- All 6 prayer times (including Sunrise)

---

## 🎨 Color Themes

Each page has its own gradient:

```
📿 Zikr Counter
   Background: Teal (#1B998B) → Ocean Blue (#0F4C75)
   Accent: Golden (#D4AF37)

🕌 Salat Tracker
   Background: Blue (#3B82F6) → Indigo → Purple (#7C3AED)
   Accent: White

🌙 Fasting Tracker
   Background: Purple (#9333EA) → Purple-800 → Indigo (#4F46E5)
   Accent: White

⏰ Prayer Times
   Background: Amber (#F59E0B) → Yellow → Orange (#F97316)
   Accent: White
```

---

## 📱 Responsive Behavior

### **Mobile (< 640px)**

- Single column layout
- Full-width cards
- Stacked buttons
- Touch-optimized (44px min)

### **Tablet (640px - 1024px)**

- 2-column grid on home
- Medium card sizes
- Side-by-side layouts

### **Desktop (> 1024px)**

- 2-column grid on home
- Larger typography
- Enhanced animations
- More whitespace

---

## ✨ Animations

### **Page Transitions**

- Fade in from bottom (20px)
- Stagger effect on cards
- 0.1s delay between elements

### **Interactions**

- Hover scale (1.02x on cards)
- Button hover effects
- Progress ring animations
- Counter increments

### **Loading States**

- Smooth opacity transitions
- Skeleton screens (future)
- Loading spinners

---

## 🎯 Key Interactions

### **Home Page**

1. Click any card → Navigate to focus mode
2. Hover card → Scale up slightly
3. No login required for viewing

### **Salat Tracker**

1. Click prayer → Toggle completion
2. Watch progress ring update
3. Click back → Return to home

### **Fasting Tracker**

1. Click "Fasting Today" → Toggle on/off
2. Streak increments/decrements
3. Progress bar animates

### **Prayer Times**

1. Watch clock update live
2. See next prayer countdown
3. Click "Enable" → Request location

---

## 🔍 Testing Checklist

When reviewing, check:

- [ ] Home page loads with 4 cards
- [ ] All cards are clickable
- [ ] Each focus mode page loads correctly
- [ ] Back button returns to home
- [ ] Salat tracker marks prayers
- [ ] Fasting tracker updates streak
- [ ] Prayer times shows clock
- [ ] Data persists on refresh
- [ ] Responsive on mobile
- [ ] No console errors

---

## 🎉 Enjoy Testing!

Everything is implemented and ready to explore. Have fun with the new focus mode layouts! 🚀

**Pro Tip:** Open DevTools (F12) → Application → Local Storage to see your data being saved in real-time!
