// Shared API response types

export interface ZikrTypeItem {
  _id: string;
  name: string;
  createdAt: string;
}

export interface ZikrSummaryResponse {
  ok: boolean;
  totalCount: number;
  perType: Array<{ zikrType: string; total: number }>;
  types: ZikrTypeItem[];
}

export interface ChartDataPoint {
  date: string;
  total: number;
  breakdown: Record<string, number>;
}

export interface ZikrGoal {
  userId?: string;
  dailyTarget: number;
  isActive: boolean;
}

export interface ZikrStreak {
  userId?: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  isPaused?: boolean;
  pausedAt?: string | null;
  count?: number; // alias used in some response shapes
}

export interface AnalyticsResponse {
  ok: boolean;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  chartData: ChartDataPoint[];
  stats: {
    average: number;
    maxDay: string | null;
    maxCount: number;
    total: number;
  };
  today: {
    total: number;
    goalMet: boolean;
    perType: Array<{ zikrType: string; total: number }>;
  };
  goal: ZikrGoal;
  streak: ZikrStreak;
  allTime: {
    totalCount: number;
    bestDay: { date: string | null; count: number };
  };
  perType: Array<{ zikrType: string; total: number }>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  occupation?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_say';
  birthDate?: string;
  aiEnabled?: boolean;
  totalCount?: number;
  zikrTypes?: ZikrTypeItem[];
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl?: string | null;
  emailVerified?: boolean;
}
