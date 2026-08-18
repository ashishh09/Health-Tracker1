export type TaskKey =
  | 'breakfast'
  | 'lunch'
  | 'waterGoal'
  | 'dinner'
  | 'faceWash'
  | 'brushing'
  | 'sleep';

export interface TaskDefinition {
  key: TaskKey;
  label: string;
  emoji: string;
  defaultTime: string; // 24hr "HH:mm"
  notificationTitle: string;
  notificationBody: string;
  isWater?: boolean;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  breakfast: boolean;
  lunch: boolean;
  waterGoal: boolean; // True when waterConsumed >= waterTarget
  dinner: boolean;
  faceWash: boolean;
  brushing: boolean;
  sleep: boolean;
  waterConsumed: number; // in ml
  waterTarget: number; // in ml
  completedAt?: Partial<Record<TaskKey, string>>; // ISO timestamp or HH:mm
  notes?: string;
  lastUpdated: number;
}

export interface WaterEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // in ml
  timestamp: number; // ms timestamp
  note?: string;
}

export interface AppSettings {
  userName: string;
  breakfastTime: string; // "08:00"
  lunchTime: string; // "12:00"
  dinnerTime: string; // "20:00"
  faceWashTime: string; // "21:30"
  brushingTime: string; // "22:00"
  sleepTime: string; // "22:30"
  waterTarget: number; // 3000 (ml)
  waterReminderInterval: number; // minutes (e.g. 60, 90, 120)
  notificationsEnabled: boolean;
  taskNotifications: Record<TaskKey, boolean>;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
}

export interface MonthlyStats {
  monthName: string;
  year: number;
  daysTracked: number;
  averageCompletion: number;
  fullyCompletedDays: number;
  partiallyCompletedDays: number;
  waterGoalAchievedDays: number;
  bestDay: {
    date: string;
    score: number;
  } | null;
}
