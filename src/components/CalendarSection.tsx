import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  Droplet,
  Sparkles,
} from 'lucide-react';
import { DailyRecord } from '../types';
import { useHealth } from '../context/HealthContext';
import { calculateMonthlyStats, getDayStatus, getCompletedTaskCount, getCompletionPercentage } from '../utils/statsUtils';
import { formatDisplayDate, mlToLiters, isToday, isFutureDate } from '../utils/dateUtils';
import { ORDERED_TASK_KEYS, TASK_DEFINITIONS } from '../services/notificationService';

export const CalendarSection: React.FC = () => {
  const { allRecords, currentDate, setCurrentDate, todayRecord, settings } = useHealth();

  // Selected viewing year/month for the calendar grid
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const [y] = currentDate.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const [, m] = currentDate.split('-').map(Number);
    return m || new Date().getMonth() + 1;
  });

  // Selected date for viewing day detail breakdown
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Map of allRecords by date string for O(1) lookup
  const recordsMap = useMemo(() => {
    const map = new Map<string, DailyRecord>();
    for (const r of allRecords) {
      map.set(r.date, r);
    }
    // Also ensure the currently active record is in the map
    if (todayRecord) {
      map.set(todayRecord.date, todayRecord);
    }
    return map;
  }, [allRecords, todayRecord]);

  // Compute monthly statistics
  const monthlyStats = useMemo(() => {
    const recordsList = Array.from(recordsMap.values()) as DailyRecord[];
    return calculateMonthlyStats(recordsList, currentYear, currentMonth);
  }, [recordsMap, currentYear, currentMonth]);

  // Days in month calculation (Mon - Sun layout)
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
  });

  // Details for currently selected date
  const selectedRecord = recordsMap.get(selectedDate);
  const selectedIsFuture = isFutureDate(selectedDate);
  const selectedCount = getCompletedTaskCount(selectedRecord);
  const selectedPercentage = getCompletionPercentage(selectedRecord);
  const selectedWaterConsumed = mlToLiters(selectedRecord?.waterConsumed || 0);
  const selectedWaterTarget = mlToLiters(selectedRecord?.waterTarget || settings.waterTarget || 3000);

  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleSetAsActiveDate = (dateStr: string) => {
    setCurrentDate(dateStr);
  };

  return (
    <div id="calendar-section" className="space-y-5">
      {/* Monthly Calendar View Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-all">
        {/* Calendar Header & Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {monthName} {currentYear}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Tap any date to inspect daily records
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              id="btn-prev-month"
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-next-month"
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend Symbols */}
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800/80 overflow-x-auto gap-2">
          <span className="flex items-center gap-1 shrink-0">
            <strong className="text-emerald-600 dark:text-emerald-400 text-sm">✓</strong> All Done (7/7)
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <strong className="text-amber-500 dark:text-amber-400 text-sm">◐</strong> Partial (1-6)
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <strong className="text-zinc-400 text-sm">○</strong> 0 Tasks
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <strong className="text-zinc-300 dark:text-zinc-600 text-sm">—</strong> Future
          </span>
        </div>

        {/* Week Day Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-400 uppercase mb-2">
          {weekDayHeaders.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Blank cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 rounded-xl opacity-0 pointer-events-none" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;

            const record = recordsMap.get(dateStr);
            const status = getDayStatus(record, dateStr);
            const isSelected = selectedDate === dateStr;
            const isCurrentToday = isToday(dateStr);

            return (
              <button
                key={dateStr}
                id={`calendar-day-${dateStr}`}
                type="button"
                onClick={() => handleDateClick(dateStr)}
                className={`h-14 p-1 rounded-xl flex flex-col items-center justify-between transition-all relative border ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs'
                    : isCurrentToday
                    ? 'bg-zinc-100/90 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-600 font-bold'
                    : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                } ${status.isFuture ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
              >
                {/* Day Number */}
                <span
                  className={`text-xs font-bold leading-none ${
                    isCurrentToday
                      ? 'text-emerald-600 dark:text-emerald-400 underline underline-offset-2'
                      : isSelected
                      ? 'text-emerald-900 dark:text-emerald-100'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {dayNum}
                </span>

                {/* Explicit Symbol Indicator */}
                <div
                  className={`text-sm font-black leading-none ${
                    status.symbol === '✓'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : status.symbol === '◐'
                      ? 'text-amber-500 dark:text-amber-400'
                      : status.symbol === '○'
                      ? 'text-zinc-400'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                >
                  {status.symbol}
                </div>

                {/* Micro mini percentage bar */}
                {!status.isFuture && status.percentage > 0 ? (
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        status.percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                ) : (
                  <div className="h-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detailed Summary Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Selected Day Breakdown
            </span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {formatDisplayDate(selectedDate)}
            </h3>
          </div>

          <div className="text-right">
            {selectedIsFuture ? (
              <span className="text-xs font-semibold text-zinc-400">Future Date</span>
            ) : (
              <>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  Daily Completion: {selectedPercentage}%
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {selectedCount} / 7 Tasks Completed
                </div>
              </>
            )}
          </div>
        </div>

        {selectedIsFuture ? (
          <div className="py-8 text-center text-zinc-400 text-xs">
            Future dates cannot have completed tasks. Check back on this date!
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {ORDERED_TASK_KEYS.map((key) => {
                const def = TASK_DEFINITIONS[key];
                const isDone =
                  key === 'waterGoal'
                    ? selectedRecord?.waterGoal ||
                      (selectedRecord?.waterConsumed || 0) >=
                        (selectedRecord?.waterTarget || settings.waterTarget || 3000)
                    : !!selectedRecord?.[key];

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs border ${
                      isDone
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/50 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{def.emoji}</span>
                      <span className="font-semibold">{def.label}</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold">
                      {isDone ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Circle className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Water Detail */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Hydration Total</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                Water: {selectedWaterConsumed} L / {selectedWaterTarget} L
              </span>
            </div>

            {/* Jump to active date button */}
            {selectedDate !== currentDate && (
              <button
                type="button"
                onClick={() => handleSetAsActiveDate(selectedDate)}
                className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                Switch App View to {formatDisplayDate(selectedDate)}
              </button>
            )}
          </>
        )}
      </div>

      {/* Monthly Statistics Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Monthly Statistics ({monthName} {currentYear})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Days Tracked */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Days Tracked
            </span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block">
              {monthlyStats.daysTracked}
            </span>
          </div>

          {/* Average Completion */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Average Completion
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {monthlyStats.averageCompletion}%
            </span>
          </div>

          {/* Fully Completed Days */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
              Fully Completed Days
            </span>
            <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1 block">
              {monthlyStats.fullyCompletedDays}
            </span>
          </div>

          {/* Partially Completed Days */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Partially Completed Days
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {monthlyStats.partiallyCompletedDays}
            </span>
          </div>

          {/* Water Goal Achieved */}
          <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/60">
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 block flex items-center gap-1">
              <Droplet className="w-3 h-3 fill-current" />
              Water Goal Achieved
            </span>
            <span className="text-xl font-black text-sky-800 dark:text-sky-300 mt-1 block">
              {monthlyStats.waterGoalAchievedDays} / {Math.max(monthlyStats.daysTracked, 1)} days
            </span>
          </div>

          {/* Best Day */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block flex items-center gap-1">
              <Award className="w-3 h-3" />
              Best Day
            </span>
            <span className="text-sm font-black text-amber-900 dark:text-amber-200 mt-1 block truncate">
              {monthlyStats.bestDay
                ? `${formatDisplayDate(monthlyStats.bestDay.date).split(',')[0]} — ${
                    monthlyStats.bestDay.score
                  }%`
                : 'No data yet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
