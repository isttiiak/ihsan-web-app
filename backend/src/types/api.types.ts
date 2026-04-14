// Shared API response and data types

export interface ZikrTypeItem {
  _id: string;
  name: string;
  createdAt: Date;
}

export interface ZikrIncrementItem {
  zikrType: string;
  amount?: number;
  ts?: number;
}

export interface ZikrSummaryResponse {
  ok: boolean;
  totalCount: number;
  perType: Array<{ zikrType: string; total: number }>;
  types: ZikrTypeItem[];
}

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
  isPaused: boolean;
  pausedAt: Date | null;
  pausedStreak: number;
}

export interface GoalData {
  userId: string;
  dailyTarget: number;
  isActive: boolean;
}

export interface ChartDataPoint {
  date: string;
  total: number;
  breakdown: Record<string, number>;
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
  goal: GoalData | { dailyTarget: number; isActive: boolean };
  streak: StreakData | { currentStreak: number; longestStreak: number };
  allTime: {
    totalCount: number;
    bestDay: { date: Date | null; count: number };
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
  birthDate?: Date;
  aiEnabled?: boolean;
  totalCount?: number;
}
