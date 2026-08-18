import React from 'react';
import { useHealth } from '../context/HealthContext';
import { getCompletedTaskCount, getCompletionPercentage } from '../utils/statsUtils';
import { ORDERED_TASK_KEYS, TASK_DEFINITIONS } from '../services/notificationService';
import { Check, Sparkles } from 'lucide-react';

export const CompletionScore: React.FC = () => {
  const { todayRecord, setSelectedTaskDetail, setActiveTab } = useHealth();

  const completedCount = getCompletedTaskCount(todayRecord);
  const percentage = getCompletionPercentage(todayRecord);
  const isAllComplete = completedCount === 7;

  // SVG Circular progress math
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      id="daily-completion-card"
      className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Score Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Daily Progress
            </span>
            {isAllComplete && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                <Sparkles className="w-3 h-3" />
                All Done!
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            Daily Completion: {percentage}%
          </h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
            <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{completedCount}</strong> of{' '}
            <strong>7</strong> Tasks Completed
          </p>

          {/* Linear Progress bar for quick visual */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isAllComplete
                  ? 'bg-linear-to-r from-emerald-500 to-teal-400'
                  : percentage >= 50
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Right Side: Circular Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-zinc-100 dark:stroke-zinc-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`transition-all duration-700 ease-out ${
                isAllComplete
                  ? 'stroke-emerald-500'
                  : percentage >= 50
                  ? 'stroke-emerald-500'
                  : 'stroke-amber-500'
              }`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 leading-none">
              {completedCount}
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">/7</span>
            </span>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Mini task icons pill strip */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {ORDERED_TASK_KEYS.map((key) => {
          const def = TASK_DEFINITIONS[key];
          const isDone =
            key === 'waterGoal'
              ? todayRecord.waterGoal ||
                todayRecord.waterConsumed >= (todayRecord.waterTarget || 3000)
              : !!todayRecord[key];

          return (
            <button
              key={key}
              onClick={() => {
                if (key === 'waterGoal') {
                  setActiveTab('water');
                } else {
                  setSelectedTaskDetail(key);
                }
              }}
              title={`${def.label}: ${isDone ? 'Completed' : 'Pending'}`}
              className={`flex items-center justify-center p-2 rounded-xl text-xs transition-all relative ${
                isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="text-base leading-none">{def.emoji}</span>
              {isDone && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
