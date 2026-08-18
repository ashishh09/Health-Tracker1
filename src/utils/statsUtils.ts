import { DailyRecord, MonthlyStats, TaskKey } from '../types';
import { isFutureDate } from './dateUtils';
import { ORDERED_TASK_KEYS } from '../services/notificationService';

export function getCompletedTaskCount(record: DailyRecord | null | undefined): number {
  if (!record) return 0;
  let count = 0;
  if (record.breakfast) count++;
  if (record.lunch) count++;
  // Water Goal counts as completed only when the selected daily water target has been reached
  const isWaterDone = record.waterGoal || (record.waterConsumed >= (record.waterTarget || 3000));
  if (isWaterDone) count++;
  if (record.dinner) count++;
  if (record.faceWash) count++;
  if (record.brushing) count++;
  if (record.sleep) count++;
  return count;
}

export function getCompletionPercentage(record: DailyRecord | null | undefined): number {
  if (!record) return 0;
  const count = getCompletedTaskCount(record);
  return Math.round((count / 7) * 100);
}

export type DayStatusSymbol = '✓' | '◐' | '○' | '—';

export function getDayStatus(record: DailyRecord | undefined, dateStr: string): {
  symbol: DayStatusSymbol;
  label: string;
  completedCount: number;
  percentage: number;
  isFuture: boolean;
} {
  const isFuture = isFutureDate(dateStr);
  if (isFuture) {
    return {
      symbol: '—',
      label: 'Future Date',
      completedCount: 0,
      percentage: 0,
      isFuture: true,
    };
  }

  if (!record) {
    return {
      symbol: '○',
      label: 'No tasks completed',
      completedCount: 0,
      percentage: 0,
      isFuture: false,
    };
  }

  const count = getCompletedTaskCount(record);
  const percentage = Math.round((count / 7) * 100);

  if (count === 7) {
    return {
      symbol: '✓',
      label: 'All 7 tasks completed',
      completedCount: count,
      percentage,
      isFuture: false,
    };
  }

  if (count > 0) {
    return {
      symbol: '◐',
      label: `${count} of 7 tasks completed`,
      completedCount: count,
      percentage,
      isFuture: false,
    };
  }

  return {
    symbol: '○',
    label: '0 tasks completed',
    completedCount: 0,
    percentage: 0,
    isFuture: false,
  };
}

export function calculateMonthlyStats(
  allRecords: DailyRecord[],
  year: number,
  month: number // 1-indexed (1 to 12)
): MonthlyStats {
  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  const monthRecords = allRecords.filter((r) => r.date.startsWith(monthPrefix));
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
  });

  if (monthRecords.length === 0) {
    return {
      monthName,
      year,
      daysTracked: 0,
      averageCompletion: 0,
      fullyCompletedDays: 0,
      partiallyCompletedDays: 0,
      waterGoalAchievedDays: 0,
      bestDay: null,
    };
  }

  let totalScoreSum = 0;
  let fullyCompletedDays = 0;
  let partiallyCompletedDays = 0;
  let waterGoalAchievedDays = 0;
  let bestDay: { date: string; score: number } | null = null;

  for (const record of monthRecords) {
    const count = getCompletedTaskCount(record);
    const score = Math.round((count / 7) * 100);
    totalScoreSum += score;

    if (count === 7) {
      fullyCompletedDays++;
    } else if (count > 0) {
      partiallyCompletedDays++;
    }

    const waterDone = record.waterGoal || (record.waterConsumed >= (record.waterTarget || 3000));
    if (waterDone) {
      waterGoalAchievedDays++;
    }

    if (!bestDay || score > bestDay.score) {
      bestDay = { date: record.date, score };
    }
  }

  const daysTracked = monthRecords.length;
  const averageCompletion = Math.round(totalScoreSum / daysTracked);

  return {
    monthName,
    year,
    daysTracked,
    averageCompletion,
    fullyCompletedDays,
    partiallyCompletedDays,
    waterGoalAchievedDays,
    bestDay,
  };
}
